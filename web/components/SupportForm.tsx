"use client";

import { useState } from "react";
import Link from "next/link";

type Result = {
  status?: string;
  message?: string;
  answer?: string;
  error?: string;
  ticket_id?: string;
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  resolved_auto: { label: "Đã trả lời tự động", color: "bg-signal-500" },
  escalated: { label: "Đã chuyển nhân sự", color: "bg-flare-500" },
  waiting_customer: { label: "Cần bổ sung thông tin", color: "bg-flare-500" },
  closed_spam: { label: "Đã lọc bỏ", color: "bg-ink-700" },
  closed_duplicate: { label: "Đã lọc trùng lặp", color: "bg-red-500" },
};

export default function SupportForm() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sender_identifier: contact,
          sender_name: name,
          content,
        }),
      });
      const data = await res.json();
      setResult(data);
      if (res.ok) setContent("");
    } catch {
      setResult({ error: "Không thể gửi yêu cầu. Vui lòng thử lại." });
    } finally {
      setLoading(false);
    }
  }

  const statusMeta = result?.status ? STATUS_LABEL[result.status] : null;

  return (
    <div className="w-full max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-ink-700 mb-1">Họ tên</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-ink-700/20 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal-500"
            placeholder="Nguyễn Văn A"
          />
        </div>
        <div>
          <label className="block text-sm text-ink-700 mb-1">
            Email hoặc số điện thoại
          </label>
          <input
            required
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className="w-full rounded-lg border border-ink-700/20 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal-500"
            placeholder="ban@email.com"
          />
        </div>
        <div>
          <label className="block text-sm text-ink-700 mb-1">
            Nội dung yêu cầu
          </label>
          <textarea
            required
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full rounded-lg border border-ink-700/20 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal-500"
            placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-ink-900 text-white py-2.5 text-sm font-medium hover:bg-ink-800 transition disabled:opacity-50"
        >
          {loading ? "Đang gửi..." : "Gửi yêu cầu"}
        </button>
      </form>

      {result && (
        <div className="mt-6 rounded-lg border border-ink-700/15 bg-white p-4">
          {result.error ? (
            <p className="text-sm text-flare-600">{result.error}</p>
          ) : (
            <>
              {statusMeta && (
                <div className="flex items-center gap-2 mb-2">
                  <span className={`status-dot ${statusMeta.color}`} />
                  <span className="text-xs font-mono uppercase tracking-wide text-ink-700">
                    {statusMeta.label}
                  </span>
                </div>
              )}
              <p className="text-sm text-ink-900">
                {result.answer || result.message}
              </p>
              {result.ticket_id && result.status !== "closed_spam" && (
                <Link
                  href={`/status?id=${encodeURIComponent(result.ticket_id)}&contact=${encodeURIComponent(contact)}`}
                  className="inline-block mt-3 text-xs font-mono text-signal-600 hover:underline"
                >
                  Theo dõi yêu cầu này →
                </Link>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
