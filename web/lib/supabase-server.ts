import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Dùng ở Server Components / Route Handlers. Giữ phiên đăng nhập của nhân sự
// qua cookie, vẫn tôn trọng Row Level Security (không bypass như service_role).
export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // set() gọi từ Server Component sẽ ném lỗi nếu không có middleware
            // làm mới session - có thể bỏ qua an toàn nếu đã có middleware.ts.
          }
        },
      },
    }
  );
}
