# Tổng đài Hỗ trợ Tự vận hành — Track D

Hệ thống chăm sóc khách hàng đa kênh: tiếp nhận → phân loại → tự trả lời (RAG) hoặc
chuyển nhân sự → giám sát chất lượng qua dashboard.

Stack: **n8n** (bộ não agent) + **Next.js** (kênh website + dashboard vận hành) +
**Supabase** (Postgres + pgvector + Auth).

```
support-agent-project/
├── README.md                     ← file này
├── supabase/
│   └── schema.sql                ← chạy 1 lần trong Supabase SQL Editor
├── n8n/
│   ├── core-agent-workflow.json  ← workflow chính: phân loại, RAG, escalate
│   ├── kb-indexing-workflow.json ← workflow phụ: chunk + embed tài liệu
│   ├── build_workflow.py         ← script sinh ra file JSON ở trên (tham khảo/sửa)
│   └── build_kb_workflow.py
└── web/                          ← Next.js app (form công khai + dashboard)
    ├── app/
    ├── components/
    ├── lib/
    └── .env.example
```

---

## 1. Kiến trúc hoạt động

1. Khách hàng gửi yêu cầu qua **website** (form Next.js), **email**, **chat app**
   (Zalo/Messenger/Telegram) hoặc **hệ thống nội bộ**.
2. Tất cả đổ về **một webhook n8n duy nhất** (`/webhook/support-intake`) — mỗi kênh
   chỉ cần chuẩn hóa payload về cùng format rồi POST vào webhook này.
3. n8n: ghi request thô + tạo ticket trong Supabase → gọi Claude phân loại
   (danh mục, mức ưu tiên, spam, thiếu thông tin) → nếu spam/thiếu info thì dừng và
   phản hồi tương ứng → nếu không, truy xuất tài liệu liên quan (RAG qua pgvector)
   → Claude soạn câu trả lời kèm **độ tin cậy** → nếu đủ tin cậy và thuộc danh mục
   an toàn (hỏi đáp thông tin) thì tự gửi trả lời; ngược lại **chuyển nhân sự** kèm
   tóm tắt bối cảnh và thông báo qua Slack.
4. Mọi trạng thái được ghi vào Supabase → **dashboard Next.js** hiển thị hàng đợi,
   chi tiết từng ticket, và số liệu phân tích (tỉ lệ tự động, khối lượng theo danh mục).

## 2. Thiết lập Supabase (làm trước tiên — ~30 phút)

1. Tạo project mới tại [supabase.com](https://supabase.com/).
2. Vào **SQL Editor** → New query → dán toàn bộ nội dung `supabase/schema.sql` →
   Run. Việc này tạo tất cả bảng, enum, hàm `match_document_chunks`, và RLS policy.
3. Vào **Authentication > Providers**, giữ Email/Password bật (mặc định). Vào
   **Authentication > Users** → Add user, tạo tài khoản cho từng nhân sự vận hành.
4. Vào **Table Editor > staff**, thêm 1 dòng cho mỗi nhân sự vừa tạo, điền
   `auth_user_id` (copy từ Authentication > Users), `full_name`, `email`, `team`.
5. Vào **Settings > API**, lưu lại 3 giá trị:
   - `Project URL` → dùng cho `SUPABASE_URL`
   - `anon public key` → dùng cho `NEXT_PUBLIC_SUPABASE_ANON_KEY` (an toàn để lộ ra client)
   - `service_role key` → dùng cho `SUPABASE_SERVICE_ROLE_KEY` (**chỉ dùng ở n8n,
     tuyệt đối không đưa vào code Next.js phía client**)

## 3. Thiết lập n8n (~1-1.5 giờ)

Có thể dùng **n8n Cloud** (nhanh nhất, không cần cài đặt) hoặc self-host bằng Docker:
```bash
docker run -it --rm -p 5678:5678 -v n8n_data:/home/node/.n8n docker.n8n.io/n8nio/n8n
```

1. Vào n8n → **Credentials** → tạo các credential kiểu "Header Auth":
   - `Supabase Service Role`: header `apikey` = service_role key, và thêm header
     `Authorization` = `Bearer <service_role key>`.
   - `Anthropic API Key`: header `x-api-key` = API key lấy tại
     [console.anthropic.com](https://console.anthropic.com/).
   - `Voyage AI Key` (dùng để tạo embedding cho RAG — Anthropic khuyến nghị Voyage AI
     vì Anthropic không có API embedding riêng): header `Authorization` =
     `Bearer <voyage api key>` lấy tại [voyageai.com](https://www.voyageai.com/).
   - (Tùy chọn) `Slack account` nếu muốn thông báo ticket cần xử lý vào kênh Slack.
2. Vào **Settings > Environment variables** (hoặc file `.env` nếu self-host), thêm:
   ```
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<service_role key>
   ```
3. **Import workflow**: Workflows → Import from File → chọn
   `n8n/core-agent-workflow.json`. Mở từng node HTTP Request/Slack màu đỏ (thiếu
   credential) và gán credential tương ứng đã tạo ở bước 1.
4. Làm tương tự với `n8n/kb-indexing-workflow.json`.
5. **Kích hoạt (Active)** cả 2 workflow. Vào node **Webhook - Tiếp nhận yêu cầu** →
   tab "Production URL" → copy URL này, dùng cho `N8N_WEBHOOK_URL` ở bước 4.
6. Test nhanh bằng nút "Test workflow" trong n8n + gửi 1 request mẫu qua Postman/curl:
   ```bash
   curl -X POST https://<n8n-url>/webhook/support-intake \
     -H "content-type: application/json" \
     -d '{"channel":"website","sender_identifier":"test@vidu.com","sender_name":"Test","content":"Tôi muốn hỏi giờ làm việc của cửa hàng"}'
   ```

## 4. Thiết lập Next.js (~30-45 phút)

```bash
cd web
npm install
cp .env.example .env.local
# điền NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, N8N_WEBHOOK_URL
npm run dev
```

- `http://localhost:3000` → form gửi yêu cầu (kênh website).
- `http://localhost:3000/login` → đăng nhập bằng tài khoản nhân sự đã tạo ở Supabase.
- `http://localhost:3000/dashboard` → hàng đợi, chi tiết ticket, phân tích, tài liệu.

Deploy nhanh: đẩy code lên GitHub → import vào [vercel.com](https://vercel.com/) →
điền 3 biến môi trường ở trên trong phần Environment Variables → Deploy.

## 5. Kết nối thêm kênh Email và Chat app

- **Email**: trong n8n thêm workflow mới với node **Email Trigger (IMAP)**, nối
  vào một node Set để chuẩn hóa `{channel:"email", sender_identifier: <email
  người gửi>, content: <nội dung mail>}` rồi gọi node **Execute Workflow** trỏ vào
  `Core Agent`. Trả lời tự động thì dùng node **Send Email** (SMTP) ở cuối.
- **Chat app**: dùng node **Telegram Trigger** (có sẵn trong n8n) cho Telegram,
  hoặc **Webhook** node riêng nhận sự kiện từ Zalo OA / Messenger (Facebook) rồi
  chuẩn hóa tương tự. Với đề bài chỉ cần **1 kênh chat app hoạt động thật** là đủ
  minh chứng "đa kênh" — có thể chọn Telegram vì dễ tích hợp nhất trong thời gian ngắn.
- **Hệ thống nội bộ**: minh họa bằng 1 request mẫu gọi thẳng vào webhook n8n với
  `channel:"internal"` (không cần xây dựng thêm hệ thống giả lập).

## 6. Nạp dữ liệu tài liệu (để RAG có gì để trả lời)

Vào dashboard → **Tài liệu** → thêm vài tài liệu mẫu (chính sách đổi trả, FAQ, giờ
làm việc...). Sau đó chạy thủ công workflow `KB Indexing` trong n8n (nút "Execute
workflow") để tạo chunk + embedding. Từ đó bước RAG trong Core Agent mới có dữ liệu
để truy xuất.

## 7. Checklist kiểm thử trước khi nộp bài

- [ ] Gửi 1 câu hỏi thông tin đơn giản có trong tài liệu → agent tự trả lời đúng.
- [ ] Gửi 1 câu hỏi ngoài phạm vi tài liệu → agent nhận biết thiếu dữ liệu, không
      tự trả lời bừa, chuyển nhân sự kèm tóm tắt.
- [ ] Gửi nội dung rõ ràng là spam/quảng cáo → hệ thống tự đóng, không tốn thời gian nhân sự.
- [ ] Gửi 2 yêu cầu giống hệt nhau liên tiếp → (mở rộng) kiểm tra logic trùng lặp.
- [ ] Gửi yêu cầu thiếu thông tin (VD: "sản phẩm bị lỗi" không kèm mã đơn) → hệ
      thống hỏi lại thông tin còn thiếu thay vì đoán bừa.
- [ ] Vào dashboard, xác nhận ticket hiện đúng trạng thái, độ ưu tiên, và nhân sự
      có thể trả lời thủ công rồi đóng ticket.
- [ ] Xem trang Phân tích, xác nhận số liệu tổng hợp đúng theo dữ liệu test.

## 8. Lộ trình 7 ngày (25/07 → 31/07/2026)

| Ngày | Việc cần làm |
|---|---|
| **Thứ Bảy 25/07** | Setup Supabase (mục 2), chạy schema, tạo tài khoản nhân sự. Đọc kỹ workflow `core-agent-workflow.json` để hiểu logic. |
| **Chủ Nhật 26/07** | Setup n8n, import 2 workflow, gán credential, chạy thử bằng curl cho đến khi ticket lên đúng trong Supabase. |
| **Thứ Hai 27/07** | Chạy `web/`, nối form website với webhook n8n thật, test end-to-end kênh website. |
| **Thứ Ba 28/07** | Thêm kênh Telegram (hoặc Zalo/email) cho đủ "đa kênh". Nạp 5-10 tài liệu mẫu, chạy KB Indexing, test RAG. |
| **Thứ Tư 29/07** | Hoàn thiện dashboard: test luồng chuyển nhân sự, trả lời thủ công, xem trang Phân tích. Sửa lỗi phát sinh. |
| **Thứ Năm 30/07** | Deploy Next.js lên Vercel, deploy/khóa n8n instance, kiểm thử lại toàn bộ checklist mục 7 trên môi trường thật (không phải localhost). |
| **Thứ Sáu 31/07** | Buffer: quay video demo/chuẩn bị slide báo cáo, nộp bài. Không code tính năng mới ngày này. |

Nếu thời gian eo hẹp, ưu tiên theo thứ tự: **(1) luồng lõi phân loại + escalate hoạt
động ổn định** > **(2) RAG trả lời tự động** > **(3) đa kênh thứ 2** > **(4) trang
Phân tích chi tiết**. Giám khảo thường đánh giá cao một luồng lõi chạy chắc chắn hơn
là nhiều tính năng nhưng lỗi vặt.

## 9. Giới hạn của bản MVP này (điểm có thể mở rộng khi trình bày)

- Phát hiện trùng lặp hiện mới là placeholder kiến trúc (bảng `duplicate_of_ticket_id`
  đã có sẵn) — có thể bổ sung node so sánh embedding giữa các yêu cầu gần nhau của
  cùng khách hàng để hoàn thiện.
- Việc gán `assigned_team`/`assigned_staff_id` hiện dựa trên `category`; có thể làm
  bảng ánh xạ team chi tiết hơn hoặc thêm logic phân công theo tải công việc.
- Audit log (bảng `audit_logs`) đã có schema sẵn nhưng Core Agent hiện mới ghi log
  tổng hợp ở bước quyết định cuối; có thể thêm node ghi log sau mỗi bước để giám sát
  chi tiết hơn (đúng như yêu cầu "quan sát tình trạng hoạt động").
