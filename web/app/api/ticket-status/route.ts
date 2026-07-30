import { createServiceClient } from "@/lib/supabase-service";
import { NextRequest, NextResponse } from "next/server";

// Khách hàng (chưa đăng nhập) tra cứu ticket của chính mình bằng 2 thông tin:
// ticket_id (được trả về ngay sau khi gửi yêu cầu) + contact (email/SĐT đã dùng
// lúc gửi). Route này chạy ở server với service_role nên bỏ qua RLS, vì vậy
// PHẢI tự kiểm tra khớp sender_identifier trước khi trả dữ liệu - nếu không sẽ
// lộ ticket của người khác chỉ bằng cách đoán UUID.
export async function GET(req: NextRequest) {
  const ticketId = req.nextUrl.searchParams.get("id");
  const contact = req.nextUrl.searchParams.get("contact");

  if (!ticketId || !contact) {
    return NextResponse.json(
      { error: "Thiếu mã yêu cầu hoặc thông tin liên hệ." },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();

  const { data: ticket, error } = await supabase
    .from("tickets")
    .select(
      "id, channel, sender_identifier, sender_name, category, priority, status, created_at, updated_at, resolved_at",
    )
    .eq("id", ticketId)
    .single();

  // Không tiết lộ "ticket không tồn tại" khác với "sai thông tin liên hệ" -
  // luôn trả cùng một thông báo chung để tránh dò UUID hàng loạt.
  const genericError = NextResponse.json(
    { error: "Không tìm thấy yêu cầu khớp với thông tin đã nhập." },
    { status: 404 },
  );

  if (error || !ticket) return genericError;

  const matches =
    ticket.sender_identifier.trim().toLowerCase() ===
    contact.trim().toLowerCase();
  if (!matches) return genericError;

  const { data: messages } = await supabase
    .from("messages")
    .select("direction, content, sent_by, created_at")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  return NextResponse.json({
    ticket: {
      id: ticket.id,
      channel: ticket.channel,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      created_at: ticket.created_at,
      updated_at: ticket.updated_at,
      resolved_at: ticket.resolved_at,
    },
    messages: messages || [],
  });
}
