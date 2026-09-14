"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "Trò chuyện AI", icon: "💬" },
    { href: "/status", label: "Tra cứu yêu cầu", icon: "🔍" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-ink-700/10 bg-paper/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand Logo & Online Status */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-950 text-white font-medium text-sm shadow-sm group-hover:scale-105 transition-transform">
            AI
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-ink-950 text-sm tracking-tight">
                Tổng đài Hỗ trợ AI
              </span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-signal-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-signal-500"></span>
              </span>
            </div>
            <p className="text-[11px] text-ink-700/60 font-mono">
              Trợ lý tư vấn tự động
            </p>
          </div>
        </Link>

        {/* Nav Links */}
        <nav className="flex items-center gap-1.5 sm:gap-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  isActive
                    ? "bg-ink-950 text-white shadow-sm"
                    : "text-ink-700 hover:bg-ink-950/5 hover:text-ink-950"
                }`}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}

          <div className="h-4 w-px bg-ink-700/15 mx-1 hidden sm:block" />

          <Link
            href="/login"
            className="hidden sm:flex items-center gap-1 text-xs font-mono text-ink-700/70 hover:text-ink-950 px-2.5 py-1.5 rounded-lg transition hover:bg-ink-950/5"
          >
            <span>Nhân sự</span>
            <span>→</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
