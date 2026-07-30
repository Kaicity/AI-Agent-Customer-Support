import StatusLookup from "@/components/StatusLookup";
import { Suspense } from "react";

export default function StatusPage() {
  return (
    <main className="min-h-screen flex flex-col items-center px-6 py-16 bg-paper">
      <div className="w-full max-w-lg mb-8">
        <span className="text-xs font-mono uppercase tracking-wide text-ink-700">
          Tra cứu yêu cầu
        </span>
        <h1 className="text-2xl font-medium text-ink-950 mt-1">
          Xem trạng thái yêu cầu hỗ trợ
        </h1>
        <p className="text-sm text-ink-700 mt-2">
          Nhập mã yêu cầu bạn nhận được lúc gửi và thông tin liên hệ đã dùng để
          xem phản hồi mới nhất, kể cả khi đã được nhân sự xử lý.
        </p>
      </div>
      <Suspense
        fallback={<p className="text-sm text-ink-700/50">Đang tải...</p>}
      >
        <StatusLookup />
      </Suspense>
    </main>
  );
}
