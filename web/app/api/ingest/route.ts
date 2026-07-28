import { NextRequest, NextResponse } from "next/server";

// Đây là điểm vào của kênh "website". Next.js không tự xử lý logic agent -
// nó chỉ chuẩn hóa và chuyển tiếp sang webhook n8n (nơi chứa toàn bộ luồng
// phân loại/RAG/escalate), sau đó trả kết quả về cho form.
export async function POST(req: NextRequest) {
  const body = await req.json();

  const { sender_identifier, sender_name, content } = body;

  if (!sender_identifier || !content) {
    return NextResponse.json(
      { error: "Thiếu sender_identifier hoặc content" },
      { status: 400 }
    );
  }

  const n8nUrl = process.env.N8N_WEBHOOK_URL;
  if (!n8nUrl) {
    return NextResponse.json(
      { error: "Chưa cấu hình N8N_WEBHOOK_URL trên server" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(n8nUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        channel: "website",
        sender_identifier,
        sender_name: sender_name || "",
        content,
        attachments: [],
      }),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { error: "Không thể kết nối tới agent xử lý. Vui lòng thử lại." },
      { status: 502 }
    );
  }
}
