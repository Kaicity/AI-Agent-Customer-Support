import Header from "@/components/Header";
import StatusLookup from "@/components/StatusLookup";
import { Suspense } from "react";

export default function StatusPage() {
  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col items-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-xl mb-6 text-center">
          <span className="text-xs font-mono uppercase tracking-wide text-ink-700/60">
            Tra cứu yêu cầu
          </span>
          <h1 className="text-2xl font-medium text-ink-950 mt-1 tracking-tight">
            Xem trạng thái & Tiến độ xử lý
          </h1>
          <p className="text-sm text-ink-700/70 mt-1.5">
            Nhập Mã ticket và Email/Số điện thoại để xem toàn bộ tin nhắn từ Trợ lý AI và Nhân sự phụ trách.
          </p>
        </div>
        <Suspense
          fallback={<p className="text-sm text-ink-700/50 font-mono">Đang tải...</p>}
        >
          <StatusLookup />
        </Suspense>
      </main>
    </div>
  );
}

