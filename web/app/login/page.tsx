"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("Sai email hoặc mật khẩu.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-paper px-6">
      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wide text-ink-700">
            Nhân sự vận hành
          </span>
          <h1 className="text-2xl font-medium text-ink-950 mt-1">Đăng nhập</h1>
        </div>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@congty.com"
          className="w-full rounded-lg border border-ink-700/20 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal-500"
        />
        <input
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mật khẩu"
          className="w-full rounded-lg border border-ink-700/20 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal-500"
        />
        {error && <p className="text-sm text-flare-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-ink-900 text-white py-2.5 text-sm font-medium hover:bg-ink-800 transition disabled:opacity-50"
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>
    </main>
  );
}
