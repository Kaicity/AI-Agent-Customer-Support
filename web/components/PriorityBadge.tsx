export default function PriorityBadge({ priority }: { priority: number | null }) {
  if (!priority) return <span className="text-xs text-ink-700/50">—</span>;
  const isUrgent = priority <= 2;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-mono ${
        isUrgent ? "text-flare-600" : "text-ink-700"
      }`}
    >
      <span className={`status-dot ${isUrgent ? "bg-flare-500" : "bg-ink-700/40"}`} />
      P{priority}
    </span>
  );
}
