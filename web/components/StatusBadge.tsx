const STYLES: Record<string, { label: string; className: string }> = {
  new: { label: "Mới", className: "bg-ink-700/10 text-ink-700" },
  auto_processing: { label: "Đang xử lý tự động", className: "bg-ink-700/10 text-ink-700" },
  waiting_customer: { label: "Chờ khách bổ sung", className: "bg-flare-500/10 text-flare-600" },
  resolved_auto: { label: "Đã trả lời tự động", className: "bg-signal-500/10 text-signal-600" },
  escalated: { label: "Đã chuyển nhân sự", className: "bg-flare-500/10 text-flare-600" },
  in_progress_human: { label: "Nhân sự đang xử lý", className: "bg-flare-500/10 text-flare-600" },
  resolved_human: { label: "Nhân sự đã xử lý", className: "bg-signal-500/10 text-signal-600" },
  closed_spam: { label: "Đóng - Spam", className: "bg-ink-700/10 text-ink-700" },
  closed_duplicate: { label: "Đóng - Trùng lặp", className: "bg-ink-700/10 text-ink-700" },
};

export default function StatusBadge({ status }: { status: string }) {
  const meta = STYLES[status] ?? { label: status, className: "bg-ink-700/10 text-ink-700" };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${meta.className}`}>
      {meta.label}
    </span>
  );
}
