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
    { href: "/dashboard", label: "Hàng đợi yêu cầu", icon: "📥" },
    { href: "/dashboard/analytics", label: "Phân tích chất lượng", icon: "📊" },
    { href: "/dashboard/kb", label: "Kho tài liệu AI", icon: "📚" },
  ];

  return (
    <div className="min-h-screen flex bg-paper">
      {/* Sidebar Navigation */}
      <aside className="w-64 shrink-0 bg-ink-950 text-white flex flex-col border-r border-ink-800 shadow-lg">
        {/* Brand Header */}
        <div className="p-5 border-b border-white/10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 font-bold text-white shadow-inner text-base">
            🛡️
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-medium tracking-tight">Tổng đài Vận hành</h2>
              <span className="h-2 w-2 rounded-full bg-signal-500" />
            </div>
            <p className="text-[11px] font-mono text-white/50 mt-0.5">
              Bảng điều khiển nhân sự
            </p>
          </div>
        </div>

        {/* Menu Navigation */}
        <nav className="flex-1 p-3 space-y-1.5">
          <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-white/40">
            Quản trị & Xử lý
          </div>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium text-white/80 hover:bg-ink-800 hover:text-white transition group"
            >
              <span className="text-sm group-hover:scale-110 transition-transform">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* User Info & Logout Footer */}
        <div className="p-4 border-t border-white/10 bg-white/[0.02] space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-signal-500/20 text-signal-500 flex items-center justify-center font-mono text-xs font-semibold border border-signal-500/30">
              {user.email?.slice(0, 1).toUpperCase() || "N"}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-white/90 truncate">
                {user.email}
              </p>
              <p className="text-[10px] font-mono text-signal-500 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-signal-500" />
                <span>Đang hoạt động</span>
              </p>
            </div>
          </div>

          <div className="pt-1">
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 sm:p-8 overflow-auto">{children}</main>
    </div>
  );
}

