# Tổng đài Hỗ trợ Tự vận hành

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

