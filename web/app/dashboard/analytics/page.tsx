import { createClient } from "@/lib/supabase-server";
import {
  CategoryVolumeChart,
  ResolutionSplitChart,
} from "@/components/AnalyticsCharts";
import { getCategoryLabel } from "@/helper/category";

export default async function AnalyticsPage() {
  const supabase = createClient();

  const { data: tickets } = await supabase
    .from("tickets")
    .select("category, resolution_type, status")
    .limit(2000);

  const total = tickets?.length || 0;

  const byCategory: Record<string, number> = {};
  let autoCount = 0;
  let humanCount = 0;
  let pendingCount = 0;

  tickets?.forEach((t) => {
    const cat = getCategoryLabel(t.category) || "chưa phân loại";
    byCategory[cat] = (byCategory[cat] || 0) + 1;
    if (t.resolution_type === "auto") autoCount++;
    else if (t.resolution_type === "human") humanCount++;
    else pendingCount++;
  });

  const categoryData = Object.entries(byCategory).map(([name, count]) => ({
    name,
    count,
  }));
  const resolutionData = [
    { name: "Tự động", value: autoCount },
    { name: "Nhân sự xử lý", value: humanCount },
    { name: "Đang chờ", value: pendingCount },
  ];

  const autoRate = total > 0 ? Math.round((autoCount / total) * 100) : 0;

  return (
    <div>
      <h1 className="text-xl font-medium text-ink-950 mb-1">
        Phân tích chất lượng
      </h1>
      <p className="text-sm text-ink-700 mb-6">
        Dựa trên toàn bộ ticket đã ghi nhận trong hệ thống.
      </p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-ink-700/10 p-5">
          <div className="text-xs font-mono uppercase tracking-wide text-ink-700/60">
            Tổng số yêu cầu
          </div>
          <div className="text-2xl font-medium text-ink-950 mt-1">{total}</div>
        </div>
        <div className="bg-white rounded-xl border border-ink-700/10 p-5">
          <div className="text-xs font-mono uppercase tracking-wide text-ink-700/60">
            Tỉ lệ tự trả lời
          </div>
          <div className="text-2xl font-medium text-signal-600 mt-1">
            {autoRate}%
          </div>
        </div>
        <div className="bg-white rounded-xl border border-ink-700/10 p-5">
          <div className="text-xs font-mono uppercase tracking-wide text-ink-700/60">
            Đã chuyển nhân sự
          </div>
          <div className="text-2xl font-medium text-flare-600 mt-1">
            {humanCount}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-ink-700/10 p-5">
          <h2 className="text-sm font-medium text-ink-950 mb-3">
            Khối lượng theo danh mục
          </h2>
          <CategoryVolumeChart data={categoryData} />
        </div>
        <div className="bg-white rounded-xl border border-ink-700/10 p-5">
          <h2 className="text-sm font-medium text-ink-950 mb-3">
            Tự động so với nhân sự
          </h2>
          <ResolutionSplitChart data={resolutionData} />
        </div>
      </div>
    </div>
  );
}
