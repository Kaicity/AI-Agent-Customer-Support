import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import StatusBadge from "@/components/StatusBadge";
import PriorityBadge from "@/components/PriorityBadge";
import { getCategoryLabel } from "@/helper/category";
import { TICKET_CATEGORY_LABELS } from "@/enum/ticket-category";

const STATUS_FILTERS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "escalated", label: "Cần xử lý (chuyển nhân sự)" },
  { value: "in_progress_human", label: "Nhân sự đang xử lý" },
  { value: "waiting_customer", label: "Chờ khách bổ sung" },
  { value: "resolved_auto", label: "Đã tự trả lời" },
  { value: "resolved_human", label: "Nhân sự đã xử lý" },
  { value: "new", label: "Mới" },
];

const CATEGORY_FILTERS = [
  { value: "", label: "Tất cả danh mục" },
  ...Object.entries(TICKET_CATEGORY_LABELS).map(([key, label]) => ({
    value: key,
    label,
  })),
];

function buildFilterUrl(status: string, category: string) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (category) params.set("category", category);
  const str = params.toString();
  return str ? `/dashboard?${str}` : "/dashboard";
}

export default async function QueuePage({
  searchParams,
}: {
  searchParams: { status?: string; category?: string };
}) {
  const supabase = createClient();
  const statusFilter = searchParams.status || "";
  const categoryFilter = searchParams.category || "";

  // Query stats to display summary KPI cards
  const { data: statsTickets } = await supabase
    .from("tickets")
    .select("status");

  const totalCount = statsTickets?.length || 0;
  const escalatedCount =
    statsTickets?.filter(
      (t) => t.status === "escalated" || t.status === "in_progress_human"
    ).length || 0;
  const waitingCount =
    statsTickets?.filter((t) => t.status === "waiting_customer").length || 0;
  const resolvedCount =
    statsTickets?.filter(
      (t) => t.status === "resolved_auto" || t.status === "resolved_human"
    ).length || 0;

  // Query tickets list for queue table
  let query = supabase
    .from("tickets")
    .select(
      "id, channel, sender_name, sender_identifier, category, priority, status, created_at"
    )
    .order("priority", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(50);

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  if (categoryFilter) {
    query = query.eq("category", categoryFilter);
  }

  const { data: tickets, error } = await query;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl font-medium text-ink-950">Hàng đợi yêu cầu</h1>
          <p className="text-sm text-ink-700 mt-1">
            Sắp xếp theo mức ưu tiên, mới nhất trước.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-ink-700/10 p-4">
          <div className="text-xs font-mono uppercase tracking-wide text-ink-700/60">
            Tổng số trong hàng đợi
          </div>
          <div className="text-2xl font-medium text-ink-950 mt-1">
            {totalCount}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-ink-700/10 p-4">
          <div className="text-xs font-mono uppercase tracking-wide text-ink-700/60">
            Cần nhân sự xử lý
          </div>
          <div className="text-2xl font-medium text-flare-600 mt-1">
            {escalatedCount}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-ink-700/10 p-4">
          <div className="text-xs font-mono uppercase tracking-wide text-ink-700/60">
            Chờ khách phản hồi
          </div>
          <div className="text-2xl font-medium text-ink-950 mt-1">
            {waitingCount}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-ink-700/10 p-4">
          <div className="text-xs font-mono uppercase tracking-wide text-ink-700/60">
            Đã giải quyết
          </div>
          <div className="text-2xl font-medium text-signal-600 mt-1">
            {resolvedCount}
          </div>
        </div>
      </div>

      {/* Filter Tabs & Category Selection */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-medium text-ink-700/60 self-center mr-1">
            Trạng thái:
          </span>
          {STATUS_FILTERS.map((f) => (
            <Link
              key={f.value}
              href={buildFilterUrl(f.value, categoryFilter)}
              className={`text-xs px-3 py-1.5 rounded-full border transition ${
                statusFilter === f.value
                  ? "bg-ink-950 text-white border-ink-950 font-medium"
                  : "border-ink-700/20 text-ink-700 hover:border-ink-700/40 bg-white"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-medium text-ink-700/60 self-center mr-1">
            Danh mục:
          </span>
          {CATEGORY_FILTERS.map((c) => (
            <Link
              key={c.value}
              href={buildFilterUrl(statusFilter, c.value)}
              className={`text-xs px-3 py-1.5 rounded-full border transition ${
                categoryFilter === c.value
                  ? "bg-ink-950 text-white border-ink-950 font-medium"
                  : "border-ink-700/20 text-ink-700 hover:border-ink-700/40 bg-white"
              }`}
            >
              {c.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-ink-700/10 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[650px]">
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
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-ink-700/60 text-sm"
                  >
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
                    <Link
                      href={`/dashboard/tickets/${t.id}`}
                      className="hover:underline"
                    >
                      <div className="font-medium text-ink-950">
                        {t.sender_name || t.sender_identifier}
                      </div>
                      <div className="text-xs text-ink-700/60">
                        {t.sender_identifier}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-700">{t.channel}</td>
                  <td className="px-4 py-3 text-ink-700">
                    {getCategoryLabel(t.category)}
                  </td>
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
    </div>
  );
}

