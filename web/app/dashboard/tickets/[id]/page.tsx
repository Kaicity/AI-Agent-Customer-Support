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
      },
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
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-xl font-medium text-ink-950">
          {ticket.sender_name || ticket.sender_identifier}
        </h1>
        <StatusBadge status={ticket.status} />
        <PriorityBadge priority={ticket.priority} />
      </div>
      <p className="text-sm text-ink-700/70 font-mono mb-6">
        {ticket.sender_identifier} · kênh {ticket.channel} · danh mục{" "}
        {getCategoryLabel(ticket.category) || "chưa xác định"}
      </p>

      {ticket.ai_summary && (
        <div className="rounded-xl border border-flare-500/20 bg-flare-500/5 p-4 mb-6">
          <div className="text-xs font-mono uppercase tracking-wide text-flare-600 mb-1">
            Bối cảnh do AI tổng hợp
          </div>
          <p className="text-sm text-ink-900">{ticket.ai_summary}</p>
          {ticket.confidence_score != null && (
            <p className="text-xs text-ink-700/60 mt-2">
              Độ tin cậy AI:{" "}
              {(Number(ticket.confidence_score) * 100).toFixed(0)}%
            </p>
          )}
        </div>
      )}

      <div className="space-y-3 mb-6">
        {messages?.map((m) => (
          <div
            key={m.id}
            className={`rounded-xl p-4 text-sm max-w-[85%] ${
              m.direction === "inbound"
                ? "bg-white border border-ink-700/10"
                : "bg-ink-950 text-white ml-auto"
            }`}
          >
            <div
              className={`text-xs font-mono mb-1 ${
                m.direction === "inbound" ? "text-ink-700/50" : "text-white/50"
              }`}
            >
              {m.sent_by} · {new Date(m.created_at).toLocaleString("vi-VN")}
            </div>
            {m.content}
          </div>
        ))}
        {(!messages || messages.length === 0) && (
          <p className="text-sm text-ink-700/50">Chưa có tin nhắn nào.</p>
        )}
      </div>

      <form action={sendReply} className="space-y-3">
        <input type="hidden" name="ticket_id" value={ticket.id} />
        <textarea
          name="content"
          rows={4}
          required
          placeholder="Nhập phản hồi gửi cho khách hàng..."
          className="w-full rounded-lg border border-ink-700/20 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal-500"
        />
        <button
          type="submit"
          className="rounded-lg bg-ink-900 text-white px-4 py-2 text-sm font-medium hover:bg-ink-800 transition"
        >
          Gửi phản hồi & đóng ticket
        </button>
      </form>
    </div>
  );
}
