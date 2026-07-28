-- ============================================================================
-- SCHEMA: Tổng đài Hỗ trợ Tự vận hành (Self-operating Support Hotline)
-- Chạy toàn bộ file này trong Supabase SQL Editor (Project > SQL Editor > New query)
-- ============================================================================

-- 1. Bật extension cần thiết -------------------------------------------------
create extension if not exists vector;      -- cho embeddings (RAG)
create extension if not exists pgcrypto;    -- cho gen_random_uuid()

-- 2. ENUM các loại dữ liệu ---------------------------------------------------
create type channel_type as enum ('website', 'email', 'chat_app', 'internal');

create type request_category as enum (
  'inquiry',            -- Hỏi đáp thông tin
  'complaint',          -- Khiếu nại
  'technical',          -- Yêu cầu kỹ thuật
  'payment',            -- Yêu cầu thanh toán
  'urgent',             -- Yêu cầu cần xử lý khẩn cấp
  'spam',               -- Nội dung spam
  'duplicate',          -- Yêu cầu trùng lặp
  'insufficient_info'   -- Yêu cầu thiếu thông tin
);

create type ticket_status as enum (
  'new',                -- Vừa vào hệ thống
  'auto_processing',    -- Đang được agent xử lý
  'waiting_customer',   -- Đang chờ khách bổ sung thông tin
  'resolved_auto',      -- Agent tự trả lời xong
  'escalated',          -- Đã chuyển cho nhân sự
  'in_progress_human',  -- Nhân sự đang xử lý
  'resolved_human',     -- Nhân sự đã xử lý xong
  'closed_spam',        -- Đóng vì spam
  'closed_duplicate'    -- Đóng vì trùng lặp
);

create type resolution_type as enum ('auto', 'human', 'none');

-- 3. Bảng nhân sự (người tiếp nhận khi cần chuyển) --------------------------
create table staff (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id), -- liên kết Supabase Auth login
  full_name text not null,
  email text unique not null,
  team text not null default 'general',        -- vd: 'ky_thuat', 'thanh_toan', 'khieu_nai'
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 4. Bảng requests: mọi tin nhắn thô đến từ mọi kênh -------------------------
create table requests (
  id uuid primary key default gen_random_uuid(),
  channel channel_type not null,
  external_id text,                 -- id gốc bên kênh nguồn (message id, email id...)
  sender_identifier text not null,  -- email / số điện thoại / user id kênh chat
  sender_name text,
  content text not null,
  attachments jsonb default '[]'::jsonb,
  raw_payload jsonb,                -- toàn bộ payload gốc để debug
  received_at timestamptz not null default now(),
  ticket_id uuid                    -- gán sau khi được xử lý/gộp vào ticket
);

create index idx_requests_sender on requests(sender_identifier);
create index idx_requests_received_at on requests(received_at desc);

-- 5. Bảng tickets: đơn vị xử lý ở mức "case" ---------------------------------
create table tickets (
  id uuid primary key default gen_random_uuid(),
  channel channel_type not null,
  sender_identifier text not null,
  sender_name text,
  category request_category,
  priority smallint not null default 3,  -- 1 = khẩn cấp nhất ... 5 = thấp nhất
  status ticket_status not null default 'new',
  confidence_score numeric(4,3),         -- độ tin cậy câu trả lời AI (0..1)
  assigned_team text,
  assigned_staff_id uuid references staff(id),
  ai_summary text,                       -- tóm tắt bối cảnh cho nhân sự khi chuyển
  duplicate_of_ticket_id uuid references tickets(id),
  resolution_type resolution_type not null default 'none',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index idx_tickets_status on tickets(status);
create index idx_tickets_category on tickets(category);
create index idx_tickets_priority on tickets(priority);
create index idx_tickets_created_at on tickets(created_at desc);

alter table requests
  add constraint fk_requests_ticket foreign key (ticket_id) references tickets(id);

-- 6. Bảng messages: toàn bộ hội thoại qua lại theo từng ticket ---------------
create type message_direction as enum ('inbound', 'outbound_auto', 'outbound_human');

create table messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(id) on delete cascade,
  direction message_direction not null,
  content text not null,
  sent_by text,                -- 'agent_ai' | staff email | tên khách
  created_at timestamptz not null default now()
);

create index idx_messages_ticket on messages(ticket_id, created_at);

-- 7. Knowledge base cho RAG ---------------------------------------------------
create table documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source_url text,
  content text not null,        -- full text gốc
  uploaded_by text,
  created_at timestamptz not null default now()
);

create table document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  chunk_index int not null,
  chunk_text text not null,
  embedding vector(1536),       -- kích thước cho text-embedding-3-small (OpenAI) hoặc tương đương
  created_at timestamptz not null default now()
);

create index idx_chunks_document on document_chunks(document_id);
-- Index vector search (IVFFlat) - chạy sau khi đã có dữ liệu để index hiệu quả hơn
create index idx_chunks_embedding on document_chunks
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Hàm tìm kiếm ngữ nghĩa (dùng trong node n8n bước RAG retrieval)
create or replace function match_document_chunks(
  query_embedding vector(1536),
  match_count int default 5,
  similarity_threshold float default 0.75
)
returns table (
  chunk_id uuid,
  document_id uuid,
  chunk_text text,
  similarity float
)
language sql stable
as $$
  select
    dc.id as chunk_id,
    dc.document_id,
    dc.chunk_text,
    1 - (dc.embedding <=> query_embedding) as similarity
  from document_chunks dc
  where 1 - (dc.embedding <=> query_embedding) > similarity_threshold
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;

-- 8. Audit log: ghi lại từng bước agent xử lý để giám sát & cải tiến --------
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references tickets(id) on delete cascade,
  step text not null,          -- vd: 'classify', 'spam_check', 'duplicate_check', 'rag_retrieve', 'answer_generate', 'escalate'
  input jsonb,
  output jsonb,
  model_used text,
  confidence numeric(4,3),
  duration_ms int,
  created_at timestamptz not null default now()
);

create index idx_audit_ticket on audit_logs(ticket_id, created_at);

-- 9. updated_at tự động cho tickets ------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_tickets_updated_at
before update on tickets
for each row execute function set_updated_at();

-- 10. Row Level Security (bật cơ bản; điều chỉnh policy theo nhu cầu thật) ---
alter table tickets enable row level security;
alter table requests enable row level security;
alter table messages enable row level security;
alter table audit_logs enable row level security;
alter table documents enable row level security;
alter table document_chunks enable row level security;
alter table staff enable row level security;

-- Cho phép người dùng đã đăng nhập (nhân sự) đọc/ghi mọi bản ghi.
-- Việc ghi từ n8n sẽ dùng service_role key (tự động bỏ qua RLS) nên không cần policy riêng cho n8n.
create policy "staff can read tickets" on tickets for select using (auth.role() = 'authenticated');
create policy "staff can update tickets" on tickets for update using (auth.role() = 'authenticated');
create policy "staff can read requests" on requests for select using (auth.role() = 'authenticated');
create policy "staff can read messages" on messages for select using (auth.role() = 'authenticated');
create policy "staff can insert messages" on messages for insert with check (auth.role() = 'authenticated');
create policy "staff can read audit logs" on audit_logs for select using (auth.role() = 'authenticated');
create policy "staff can read documents" on documents for select using (auth.role() = 'authenticated');
create policy "staff can manage documents" on documents for insert with check (auth.role() = 'authenticated');
create policy "staff can read chunks" on document_chunks for select using (auth.role() = 'authenticated');
create policy "staff can read staff" on staff for select using (auth.role() = 'authenticated');

-- ============================================================================
-- XONG. Sau khi chạy file này:
-- 1. Vào Authentication > tạo tài khoản cho từng nhân sự vận hành.
-- 2. Thêm dòng tương ứng vào bảng `staff` (liên kết auth_user_id).
-- 3. Lấy Project URL + anon key + service_role key trong Settings > API để
--    dùng cho n8n (service_role) và Next.js (anon key ở frontend, service_role
--    chỉ ở server / n8n, KHÔNG bao giờ đưa service_role ra client).
-- ============================================================================
