import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import StatusBadge from "@/components/StatusBadge";
import PriorityBadge from "@/components/PriorityBadge";

const FILTERS = [
  { value: "", label: "Tất cả" },
  { value: "escalated", label: "Cần xử lý (chuyển nhân sự)" },
  { value: "waiting_customer", label: "Chờ khách bổ sung" },
  { value: "resolved_auto", label: "Đã tự trả lời" },
];

export default async function QueuePage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const supabase = createClient();
  const statusFilter = searchParams.status || "";

  let query = supabase
    .from("tickets")
    .select("id, channel, sender_name, sender_identifier, category, priority, status, created_at")
    .order("priority", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(50);

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const { data: tickets, error } = await query;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium text-ink-950">Hàng đợi yêu cầu</h1>
          <p className="text-sm text-ink-700 mt-1">
            Sắp xếp theo mức ưu tiên, mới nhất trước.
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value ? `/dashboard?status=${f.value}` : "/dashboard"}
            className={`text-xs px-3 py-1.5 rounded-full border ${
              statusFilter === f.value
                ? "bg-ink-950 text-white border-ink-950"
                : "border-ink-700/20 text-ink-700 hover:border-ink-700/40"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-ink-700/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink-950/[0.03] text-ink-700 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Ưu tiên</th>
              <th className="text-left px-4 py-3 font-medium">Khách hàng</th>
              <th className="text-left px-4 py-3 font-medium">Kênh</th>
              <th className="text-left px-4 py-3 font-medium">Danh mục</th>
              <th className="text-left px-4 py-3 font-medium">Trạng thái</th>
              <th className="text-left px-4 py-3 font-medium">Thời gian</th>
            </tr>
          </thead>
          <tbody>
            {error && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-flare-600 text-sm">
                  Không tải được dữ liệu: {error.message}
                </td>
              </tr>
            )}
            {tickets && tickets.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-ink-700/60 text-sm">
                  Không có yêu cầu nào phù hợp bộ lọc.
                </td>
              </tr>
            )}
            {tickets?.map((t) => (
              <tr
                key={t.id}
                className="border-t border-ink-700/5 hover:bg-ink-950/[0.02] cursor-pointer"
              >
                <td className="px-4 py-3">
                  <PriorityBadge priority={t.priority} />
                </td>
                <td className="px-4 py-3">
                  <Link href={`/dashboard/tickets/${t.id}`} className="hover:underline">
                    <div className="font-medium text-ink-950">
                      {t.sender_name || t.sender_identifier}
                    </div>
                    <div className="text-xs text-ink-700/60">{t.sender_identifier}</div>
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink-700">{t.channel}</td>
                <td className="px-4 py-3 text-ink-700">{t.category || "—"}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={t.status} />
                </td>
                <td className="px-4 py-3 text-ink-700/60 text-xs font-mono">
                  {new Date(t.created_at).toLocaleString("vi-VN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
