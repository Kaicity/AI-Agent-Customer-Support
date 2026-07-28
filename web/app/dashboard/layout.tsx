import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { LogoutButton } from "@/components/LogoutButton";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const navItems = [
    { href: "/dashboard", label: "Hàng đợi" },
    { href: "/dashboard/analytics", label: "Phân tích" },
    { href: "/dashboard/kb", label: "Tài liệu" },
  ];

  return (
    <div className="min-h-screen flex bg-paper">
      <aside className="w-56 shrink-0 bg-ink-950 text-white flex flex-col">
        <div className="px-5 py-6">
          <span className="text-xs font-mono uppercase tracking-wide text-white/50">
            Vận hành
          </span>
          <h2 className="text-base font-medium mt-1">Tổng đài Hỗ trợ</h2>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-ink-800 hover:text-white transition"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-5 py-4 text-xs">
          <LogoutButton />
        </div>
        <div className="px-5 py-4 text-xs text-white/40 border-t border-white/10">
          {user.email}
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
