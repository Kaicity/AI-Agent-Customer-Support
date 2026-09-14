"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
  status?: string;
  ticket_id?: string;
  answer?: string;
  error?: string;
};

const SUGGESTIONS = [
  { icon: "💡", title: "Hỏi đáp dịch vụ", text: "Hướng dẫn các tính năng chính của hệ thống tư vấn hỗ trợ" },
  { icon: "⚙️", title: "Sự cố kỹ thuật", text: "Tôi cần hỗ trợ xử lý lỗi kết nối và đăng nhập tài khoản" },
  { icon: "💳", title: "Thanh toán & Hóa đơn", text: "Quy trình thanh toán dịch vụ và xuất hóa đơn VAT" },
  { icon: "❓", title: "Quy trình hỗ trợ", text: "Thời gian phản hồi và các bước xử lý khi chuyển cho nhân sự" },
];

export default function SupportChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [showUserModal, setShowUserModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load stored user info on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedName = localStorage.getItem("csap_user_name") || "";
      const savedContact = localStorage.getItem("csap_user_contact") || "";
      setName(savedName);
      setContact(savedContact);
    }
  }, []);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Save user info handler
  function saveUserInfo(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !contact.trim()) return;
    if (typeof window !== "undefined") {
      localStorage.setItem("csap_user_name", name.trim());
      localStorage.setItem("csap_user_contact", contact.trim());
    }
    setShowUserModal(false);
    setErrorMsg(null);
  }

  // Handle message send
  async function handleSend(textToSend?: string) {
    const messageContent = (textToSend || input).trim();
    if (!messageContent || loading) return;

    // Check user info requirement
    if (!name.trim() || !contact.trim()) {
      setShowUserModal(true);
      return;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageContent,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sender_name: name.trim(),
          sender_identifier: contact.trim(),
          content: messageContent,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Không thể kết nối dịch vụ.");
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer || data.message || "Yêu cầu của bạn đã được ghi nhận.",
        status: data.status,
        ticket_id: data.ticket_id,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorBotMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: err.message || "Có lỗi xảy ra trong quá trình xử lý. Vui lòng thử lại.",
        error: "system_error",
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, errorBotMsg]);
    } finally {
      setLoading(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleInputResize(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  }

  function handleResetChat() {
    setMessages([]);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] max-w-4xl mx-auto px-3 sm:px-6 relative">
      {/* Top Bar / Profile bar */}
      <div className="flex items-center justify-between py-3 border-b border-ink-700/10 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase tracking-wide text-ink-700/60">
            Hội thoại AI
          </span>
          {messages.length > 0 && (
            <button
              onClick={handleResetChat}
              className="text-xs text-ink-700/60 hover:text-ink-950 px-2 py-0.5 rounded hover:bg-ink-950/5 transition font-mono"
            >
              + Cuộc trò chuyện mới
            </button>
          )}
        </div>

        {/* User profile button */}
        <button
          onClick={() => setShowUserModal(true)}
          className="flex items-center gap-1.5 text-xs bg-white border border-ink-700/15 hover:border-ink-700/30 px-3 py-1.5 rounded-full shadow-2xs transition text-ink-900"
        >
          <span className="h-2 w-2 rounded-full bg-signal-500" />
          <span className="font-medium max-w-[140px] truncate">
            {name ? name : "Chưa nhập tên"}
          </span>
          <span className="text-ink-700/40 text-[10px]">⚙️</span>
        </button>
      </div>

      {/* Messages Stream Container */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6 scroll-smooth pr-1">
        {/* Welcome state when no messages */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 my-auto">
            <div className="h-16 w-16 rounded-2xl bg-ink-950 text-white flex items-center justify-center text-2xl shadow-md">
              ✨
            </div>
            <div className="max-w-md space-y-2">
              <h2 className="text-2xl font-medium text-ink-950 tracking-tight">
                Tôi có thể hỗ trợ gì cho bạn hôm nay?
              </h2>
              <p className="text-sm text-ink-700/70">
                Hệ thống AI tiếp nhận và giải đáp câu hỏi tự động 24/7. Nếu vấn đề phức tạp, yêu cầu sẽ được chuyển ngay cho nhân sự chuyên trách.
              </p>
            </div>

            {/* User Contact Alert if not set */}
            {(!name || !contact) && (
              <div className="w-full max-w-md bg-flare-500/5 border border-flare-500/20 rounded-xl p-3.5 text-left flex items-center justify-between">
                <div className="text-xs text-ink-900">
                  <p className="font-medium text-flare-600">Thiết lập thông tin liên hệ</p>
                  <p className="text-ink-700/70 mt-0.5">Nhập họ tên & email để lưu kết quả tư vấn</p>
                </div>
                <button
                  onClick={() => setShowUserModal(true)}
                  className="text-xs font-medium bg-ink-950 text-white px-3 py-1.5 rounded-lg hover:bg-ink-800 transition"
                >
                  Cập nhật ngay
                </button>
              </div>
            )}

            {/* Prompt Suggestions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl pt-2">
              {SUGGESTIONS.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(s.text)}
                  className="flex flex-col text-left p-3.5 rounded-xl bg-white border border-ink-700/10 hover:border-ink-700/30 hover:shadow-xs transition group"
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-ink-950 group-hover:text-signal-600 transition">
                    <span>{s.icon}</span>
                    <span>{s.title}</span>
                  </div>
                  <p className="text-xs text-ink-700/60 mt-1 line-clamp-2">
                    {s.text}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Bubble List */}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-3 max-w-3xl ${
              m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            }`}
          >
            {/* Avatar */}
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-medium shadow-2xs ${
                m.role === "user"
                  ? "bg-ink-800 text-white"
                  : "bg-ink-950 text-white"
              }`}
            >
              {m.role === "user" ? name.slice(0, 1).toUpperCase() || "U" : "AI"}
            </div>

            {/* Content Box */}
            <div
              className={`flex flex-col space-y-2 max-w-[85%] sm:max-w-[80%] rounded-2xl p-4 text-sm ${
                m.role === "user"
                  ? "bg-ink-950 text-white rounded-tr-xs"
                  : "bg-white border border-ink-700/10 text-ink-950 rounded-tl-xs shadow-2xs"
              }`}
            >
              {/* Message Header Info */}
              <div
                className={`text-[11px] font-mono flex items-center gap-2 ${
                  m.role === "user" ? "text-white/50" : "text-ink-700/50"
                }`}
              >
                <span>{m.role === "user" ? name || "Khách hàng" : "Trợ lý AI"}</span>
                <span>·</span>
                <span>{new Date(m.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>

              {/* Status Badge for Bot Responses */}
              {m.role === "assistant" && m.status && (
                <div className="pt-0.5">
                  <StatusBadge status={m.status} />
                </div>
              )}

              {/* Text Body */}
              <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>

              {/* Action Link for Ticket tracking */}
              {m.ticket_id && m.status !== "closed_spam" && (
                <div className="pt-2 border-t border-ink-700/10 mt-1">
                  <Link
                    href={`/status?id=${encodeURIComponent(m.ticket_id)}&contact=${encodeURIComponent(contact)}`}
                    className="inline-flex items-center gap-1 text-xs font-mono font-medium text-signal-600 hover:underline"
                  >
                    <span>Xem chi tiết tiến độ ticket</span>
                    <span>→</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex gap-3 max-w-3xl mr-auto">
            <div className="h-8 w-8 rounded-full bg-ink-950 text-white flex items-center justify-center text-xs font-medium shadow-2xs">
              AI
            </div>
            <div className="bg-white border border-ink-700/10 rounded-2xl rounded-tl-xs p-4 shadow-2xs flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-signal-500 animate-ping" />
              <span className="text-xs text-ink-700/70 font-mono">Đang suy nghĩ & tra cứu...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Prompt Input Dock */}
      <div className="py-4 bg-paper border-t border-ink-700/10 shrink-0">
        <div className="relative bg-white rounded-2xl border border-ink-700/20 shadow-sm focus-within:border-ink-950 focus-within:ring-2 focus-within:ring-ink-950/10 transition p-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={handleInputResize}
            onKeyDown={handleKeyDown}
            placeholder={
              name && contact
                ? "Nhập câu hỏi của bạn... (Ấn Enter để gửi)"
                : "Vui lòng nhập tên & liên hệ trước khi chat..."
            }
            className="w-full resize-none border-0 bg-transparent px-3 py-2 text-sm text-ink-950 placeholder:text-ink-700/40 focus:outline-none focus:ring-0 max-h-40"
          />

          <div className="flex items-center justify-between px-2 pt-1 border-t border-ink-700/5">
            <div className="text-[11px] text-ink-700/50 font-mono">
              {name && contact ? (
                <span>Gửi với tư cách: <strong className="text-ink-900">{name}</strong></span>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowUserModal(true)}
                  className="text-flare-600 hover:underline"
                >
                  ⚠️ Nhấp để thêm thông tin người dùng
                </button>
              )}
            </div>

            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="h-8 w-8 rounded-xl bg-ink-950 text-white flex items-center justify-center hover:bg-ink-800 transition disabled:opacity-30 shadow-xs"
              title="Gửi tin nhắn"
            >
              🚀
            </button>
          </div>
        </div>
        <p className="text-[11px] text-center text-ink-700/40 mt-2 font-mono">
          Hệ thống kết hợp AI tự động & nhân sự chuyên trách hỗ trợ bạn.
        </p>
      </div>

      {/* User Info Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 bg-ink-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-ink-700/10 shadow-xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-medium text-ink-950">Thông tin người dùng</h3>
                <p className="text-xs text-ink-700/60 mt-0.5">
                  Lưu thông tin để hệ thống ghi nhận và gửi phản hồi khi chuyển nhân sự
                </p>
              </div>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-ink-700/40 hover:text-ink-950 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={saveUserInfo} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-ink-700 mb-1">
                  Họ và tên <span className="text-flare-600">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Nguyễn Văn A"
                  className="w-full rounded-xl border border-ink-700/20 bg-white px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-700 mb-1">
                  Email hoặc Số điện thoại <span className="text-flare-600">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="VD: email@congty.com hoặc 0912..."
                  className="w-full rounded-xl border border-ink-700/20 bg-white px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal-500"
                />
              </div>

              {errorMsg && <p className="text-xs text-flare-600">{errorMsg}</p>}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-ink-700 hover:bg-ink-950/5 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-ink-950 text-white hover:bg-ink-800 transition"
                >
                  Lưu & Tiếp tục
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
