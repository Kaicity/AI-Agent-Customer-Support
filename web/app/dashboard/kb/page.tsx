import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

async function addDocument(formData: FormData) {
  "use server";
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  if (!title?.trim() || !content?.trim()) return;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.from("documents").insert({
    title,
    content,
    uploaded_by: user?.email || "nhan_su",
  });

  revalidatePath("/dashboard/kb");
}

export default async function KnowledgeBasePage() {
  const supabase = createClient();
  const { data: documents } = await supabase
    .from("documents")
    .select("id, title, created_at, uploaded_by")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-medium text-ink-950 mb-1">Tài liệu tri thức</h1>
      <p className="text-sm text-ink-700 mb-6">
        Nội dung ở đây là nguồn để agent tra cứu khi trả lời tự động (RAG). Sau khi
        thêm tài liệu, workflow n8n "Chunk &amp; Embed tài liệu" (chạy định kỳ hoặc
        thủ công) sẽ tách đoạn và tạo embedding trước khi agent có thể dùng được.
      </p>

      <form action={addDocument} className="bg-white rounded-xl border border-ink-700/10 p-5 space-y-3 mb-8">
        <input
          name="title"
          required
          placeholder="Tiêu đề tài liệu (VD: Chính sách đổi trả)"
          className="w-full rounded-lg border border-ink-700/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal-500"
        />
        <textarea
          name="content"
          required
          rows={6}
          placeholder="Dán nội dung đầy đủ của tài liệu vào đây..."
          className="w-full rounded-lg border border-ink-700/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal-500"
        />
        <button
          type="submit"
          className="rounded-lg bg-ink-900 text-white px-4 py-2 text-sm font-medium hover:bg-ink-800 transition"
        >
          Thêm tài liệu
        </button>
      </form>

      <div className="bg-white rounded-xl border border-ink-700/10 divide-y divide-ink-700/5">
        {documents?.map((d) => (
          <div key={d.id} className="px-4 py-3 flex items-center justify-between text-sm">
            <div>
              <div className="font-medium text-ink-950">{d.title}</div>
              <div className="text-xs text-ink-700/50 font-mono">
                {d.uploaded_by} · {new Date(d.created_at).toLocaleString("vi-VN")}
              </div>
            </div>
          </div>
        ))}
        {(!documents || documents.length === 0) && (
          <div className="px-4 py-8 text-center text-sm text-ink-700/50">
            Chưa có tài liệu nào.
          </div>
        )}
      </div>
    </div>
  );
}
