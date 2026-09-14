import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import StatusBadge from "@/components/StatusBadge";
import PriorityBadge from "@/components/PriorityBadge";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCategoryLabel } from "@/helper/category";

async function sendReply(formData: FormData) {
  "use server";
  const ticketId = formData.get("ticket_id") as string;
  const content = formData.get("content") as string;
  if (!content?.trim()) return;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Lấy ticket để biết channel và chat_id
  const { data: ticket } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", ticketId)
    .single();

  if (!ticket) return;

  await supabase.from("messages").insert({
    ticket_id: ticketId,
    direction: "outbound_human",
    content,
    sent_by: user?.email || "nhan_su",
  });

  // Gửi phản hồi zalo
  if (ticket.channel === "chat_app") {
    const response = await fetch(
      `https://bot-api.zaloplatforms.com/bot${process.env.ZALO_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: ticket.sender_identifier,
          text: content,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Zalo API Error:", error);

      throw new Error("Không gửi được tin nhắn Zalo");
    }
  }

  await supabase
    .from("tickets")
    .update({
      status: "resolved_human",
      resolution_type: "human",
      resolved_at: new Date().toISOString(),
    })
    .eq("id", ticketId);

  revalidatePath(`/dashboard/tickets/${ticketId}`);
  redirect(`/dashboard/tickets/${ticketId}`);
}

export default async function TicketDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: ticket } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!ticket) {
    redirect("/dashboard");
  }

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("ticket_id", params.id)
    .order("created_at", { ascending: true });

  return (
    <div className="max-w-4xl space-y-6">
      {/* Top Navigation */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-xs font-mono text-ink-700/60 hover:text-ink-950 transition mb-3"
        >
          <span>←</span>
          <span>Quay lại Hàng đợi yêu cầu</span>
        </Link>
      </div>

      {/* Ticket Main Card Header */}
      <div className="bg-white rounded-2xl border border-ink-700/10 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ink-700/10">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-medium text-ink-950">
                {ticket.sender_name || ticket.sender_identifier}
              </h1>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
            <p className="text-xs text-ink-700/60 font-mono mt-1">
              Khách hàng: <strong className="text-ink-900">{ticket.sender_identifier}</strong> · Kênh: <strong className="text-ink-900">{ticket.channel}</strong> · Danh mục: <strong className="text-ink-900">{getCategoryLabel(ticket.category) || "chưa xác định"}</strong>
            </p>
          </div>

          <div className="text-xs font-mono text-ink-700/50 self-start sm:self-auto">
            Khởi tạo: {new Date(ticket.created_at).toLocaleString("vi-VN")}
          </div>
        </div>

        {/* AI Summary Box */}
        {ticket.ai_summary && (
          <div className="mt-4 rounded-xl border border-flare-500/20 bg-flare-500/5 p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-mono uppercase tracking-wide text-flare-600 font-medium">
                ✨ Bối cảnh do Trợ lý AI tổng hợp
              </span>
              {ticket.confidence_score != null && (
                <span className="text-[11px] font-mono bg-flare-500/10 text-flare-600 px-2 py-0.5 rounded-full font-medium">
                  Độ tin cậy AI: {(Number(ticket.confidence_score) * 100).toFixed(0)}%
                </span>
              )}
            </div>
            <p className="text-sm text-ink-900 leading-relaxed mt-1">
              {ticket.ai_summary}
            </p>
          </div>
        )}
      </div>

      {/* Messages Stream Timeline */}
      <div className="bg-white rounded-2xl border border-ink-700/10 p-6 shadow-sm space-y-4">
        <h2 className="text-xs font-mono uppercase tracking-wider text-ink-700/60 pb-2 border-b border-ink-700/10">
          Lịch sử trao đổi tin nhắn
        </h2>

        <div className="space-y-3.5">
          {messages?.map((m) => (
            <div
              key={m.id}
              className={`rounded-2xl p-4 text-sm max-w-[85%] ${
                m.direction === "inbound"
                  ? "bg-paper border border-ink-700/10 text-ink-950"
                  : "bg-ink-950 text-white ml-auto shadow-2xs"
              }`}
            >
              <div
                className={`text-[11px] font-mono mb-1.5 flex items-center justify-between gap-4 ${
                  m.direction === "inbound" ? "text-ink-700/60" : "text-white/60"
                }`}
              >
                <span>{m.direction === "inbound" ? `Khách hàng (${m.sent_by || ticket.sender_name || "Guest"})` : `Nhân sự (${m.sent_by})`}</span>
                <span>{new Date(m.created_at).toLocaleString("vi-VN")}</span>
              </div>
              <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
            </div>
          ))}
          {(!messages || messages.length === 0) && (
            <p className="text-sm text-ink-700/50 text-center py-6">
              Chưa có tin nhắn nào trong cuộc hội thoại này.
            </p>
          )}
        </div>
      </div>

      {/* Staff Reply Form */}
      <div className="bg-white rounded-2xl border border-ink-700/10 p-6 shadow-sm">
        <h2 className="text-xs font-mono uppercase tracking-wider text-ink-700/60 mb-3">
          Phản hồi & Xử lý ticket
        </h2>

        <form action={sendReply} className="space-y-4">
          <input type="hidden" name="ticket_id" value={ticket.id} />
          
          <textarea
            name="content"
            rows={4}
            required
            placeholder="Nhập nội dung trả lời gửi cho khách hàng..."
            className="w-full rounded-xl border border-ink-700/20 bg-white p-3.5 text-sm text-ink-950 focus:outline-none focus:ring-2 focus:ring-signal-500 shadow-2xs"
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-ink-700/50 font-mono">
              Gửi phản hồi sẽ cập nhật trạng thái ticket thành <strong className="text-signal-600">Nhân sự đã xử lý</strong>.
            </p>

            <button
              type="submit"
              className="w-full sm:w-auto rounded-xl bg-ink-950 text-white px-5 py-2.5 text-sm font-medium hover:bg-ink-800 transition shadow-xs"
            >
              🚀 Gửi phản hồi & Đóng ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

