import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// CẢNH BÁO: client này dùng service_role key, bỏ qua toàn bộ Row Level Security.
// Chỉ được import trong Route Handler (app/api/**/route.ts) - không bao giờ
// import vào Client Component ('use client') hay để lộ key này ra NEXT_PUBLIC_*.
// Dùng để đọc dữ liệu "thay mặt" khách hàng chưa đăng nhập (VD: trang tra cứu
// trạng thái ticket), sau khi đã tự xác minh quyền truy cập trong code Route Handler.
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
