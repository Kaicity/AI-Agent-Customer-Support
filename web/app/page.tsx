import SupportForm from "@/components/SupportForm";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center px-6 py-16 bg-paper">
      <div className="w-full max-w-lg mb-8">
        <span className="text-xs font-mono uppercase tracking-wide text-ink-700">
          Trung tâm hỗ trợ
        </span>
        <h1 className="text-2xl font-medium text-ink-950 mt-1">
          Gửi yêu cầu hỗ trợ
        </h1>
        <p className="text-sm text-ink-700 mt-2">
          Hệ thống sẽ tự động tiếp nhận, phân loại và phản hồi. Với các trường hợp
          phức tạp, yêu cầu của bạn sẽ được chuyển cho nhân sự phụ trách.
        </p>
      </div>
      <SupportForm />
    </main>
  );
}
