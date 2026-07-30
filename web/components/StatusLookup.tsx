"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";

type Message = {
  direction: string;
  content: string;
  sent_by: string;
  created_at: string;
};

type TicketData = {
  ticket: {
    id: string;
    channel: string;
    category: string | null;
    priority: number | null;
    status: string;
    created_at: string;
    updated_at: string;
    resolved_at: string | null;
  };
  messages: Message[];
};

const POLL_INTERVAL_MS = 8000;

export default function StatusLookup() {
  const searchParams = useSearchParams();
  const [ticketId, setTicketId] = useState(searchParams.get("id") || "");
  const [contact, setContact] = useState(searchParams.get("contact") || "");
  const [data, setData] = useState<TicketData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const lookup = useCallback(async (id: string, c: string, silent = false) => {
    if (!id || !c) return;
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const res = await fetch(
        `/api/ticket-status?id=${encodeURIComponent(id)}&contact=${encodeURIComponent(c)}`
      );
      const json = await res.json();
      if (!res.ok) {
        if (!silent) setError(json.error || "Có lỗi xảy ra.");
        return;
      }
      setData(json);
      if (!silent) setError(null);
    } catch {
      if (!silent) setError("Không thể kết nối. Vui lòng thử lại.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Tự tra cứu ngay nếu link đã có sẵn id + contact (từ form gửi yêu cầu)
  useEffect(() => {
    if (searchParams.get("id") && searchParams.get("contact")) {
      lookup(searchParams.get("id")!, searchParams.get("contact")!);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tự làm mới mỗi 8 giây để thấy tin nhắn mới của nhân sự mà không cần bấm lại
  useEffect(() => {
    if (!data) return;
    const interval = setInterval(() => {
      lookup(data.ticket.id, contact, true);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [data, contact, lookup]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    lookup(ticketId, contact);
  }

  return (
    <div className="w-full max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-3 mb-6">
        <div>
          <label className="block text-sm text-ink-700 mb-1">Mã yêu cầu (Ticket ID)</label>
          <input
            required
            value={ticketId}
            onChange={(e) => setTicketId(e.target.value)}
            placeholder="VD: 3f1b2c4a-..."
            className="w-full rounded-lg border border-ink-700/20 bg-white px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-signal-500"
          />
        </div>
        <div>
          <label className="block text-sm text-ink-700 mb-1">Email hoặc số điện thoại đã dùng</label>
          <input
            required
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="ban@email.com"
            className="w-full rounded-lg border border-ink-700/20 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-ink-900 text-white py-2.5 text-sm font-medium hover:bg-ink-800 transition disabled:opacity-50"
        >
          {loading ? "Đang tra cứu..." : "Tra cứu"}
        </button>
      </form>

      {error && (
        <div className="rounded-lg border border-flare-500/20 bg-flare-500/5 p-4 text-sm text-flare-600">
          {error}
        </div>
      )}

      {data && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <StatusBadge status={data.ticket.status} />
            <span className="text-xs text-ink-700/50 font-mono">
              Cập nhật: {new Date(data.ticket.updated_at).toLocaleString("vi-VN")}
            </span>
          </div>

          <div className="space-y-3">
            {data.messages.map((m, i) => (
              <div
                key={i}
                className={`rounded-xl p-4 text-sm max-w-[85%] ${
                  m.direction === "inbound"
                    ? "bg-white border border-ink-700/10"
                    : "bg-ink-950 text-white ml-auto"
                }`}
              >
                <div
                  className={`text-xs font-mono mb-1 ${
                    m.direction === "inbound" ? "text-ink-700/50" : "text-white/50"
                  }`}
                >
                  {m.direction === "inbound" ? "Bạn" : m.sent_by || "Nhân viên hỗ trợ"} ·{" "}
                  {new Date(m.created_at).toLocaleString("vi-VN")}
                </div>
                {m.content}
              </div>
            ))}
            {data.messages.length === 0 && (
              <p className="text-sm text-ink-700/50">
                Yêu cầu đã được ghi nhận, chưa có tin nhắn nào trong hội thoại.
              </p>
            )}
          </div>

          <p className="text-xs text-ink-700/40 mt-4">
            Trang này tự làm mới mỗi vài giây — giữ tab mở để thấy phản hồi mới ngay khi có.
          </p>
        </div>
      )}
    </div>
  );
}
