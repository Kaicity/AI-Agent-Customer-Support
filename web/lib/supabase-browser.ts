import { createBrowserClient } from "@supabase/ssr";

// Dùng ở các Client Component ('use client'). Chỉ dùng anon key ở đây,
// KHÔNG BAO GIỜ đưa service_role key vào code chạy ở trình duyệt.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
