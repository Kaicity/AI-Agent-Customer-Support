"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import Header from "@/components/Header";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Register form state
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regDepartment, setRegDepartment] = useState("support");
  const [demoNotice, setDemoNotice] = useState<string | null>(null);

  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setDemoNotice(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setError("Sai email hoặc mật khẩu.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  function handleGoogleLogin() {
    setDemoNotice(
      "Giao diện Đăng nhập Google đã sẵn sàng. Cấu hình kết nối OAuth Supabase sẽ được kích hoạt sau."
    );
  }

  function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (regPassword !== regConfirmPassword) {
      setError("Mật khẩu xác nhận không trùng khớp.");
      return;
    }
    setDemoNotice(
      `Đã ghi nhận yêu cầu tạo tài khoản cho ${regFullName} (${regEmail}). API đăng ký nhân sự sẽ được kết nối với Supabase sau.`
    );
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white rounded-2xl border border-ink-700/10 shadow-xl overflow-hidden">
          {/* Top Brand Banner */}
          <div className="bg-ink-950 p-6 text-white text-center relative">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white font-medium text-base mb-2">
              🛡️
            </div>
            <h1 className="text-lg font-medium tracking-tight">Cổng Nhân sự Vận hành</h1>
            <p className="text-xs text-white/60 font-mono mt-1">
              Hệ thống quản lý & hỗ trợ khách hàng
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex border-b border-ink-700/10 bg-paper/50 p-1">
            <button
              onClick={() => {
                setActiveTab("login");
                setError(null);
                setDemoNotice(null);
              }}
              className={`flex-1 py-2.5 text-xs font-medium rounded-xl transition ${
                activeTab === "login"
                  ? "bg-white text-ink-950 shadow-xs"
                  : "text-ink-700/60 hover:text-ink-950"
              }`}
            >
              Đăng nhập
            </button>
            <button
              onClick={() => {
                setActiveTab("register");
                setError(null);
                setDemoNotice(null);
              }}
              className={`flex-1 py-2.5 text-xs font-medium rounded-xl transition ${
                activeTab === "register"
                  ? "bg-white text-ink-950 shadow-xs"
                  : "text-ink-700/60 hover:text-ink-950"
              }`}
            >
              Đăng ký nhân sự mới
            </button>
          </div>

          <div className="p-6">
            {/* Demo Notice Banner */}
            {demoNotice && (
              <div className="mb-4 rounded-xl border border-signal-500/20 bg-signal-500/10 p-3 text-xs text-signal-600 font-mono">
                {demoNotice}
              </div>
            )}

            {/* ERROR BANNER */}
            {error && (
              <div className="mb-4 rounded-xl border border-flare-500/20 bg-flare-500/5 p-3 text-xs text-flare-600">
                {error}
              </div>
            )}

            {activeTab === "login" ? (
              <div className="space-y-4">
                {/* Google Sign In Button */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-ink-700/20 bg-white py-2.5 px-4 text-xs font-medium text-ink-900 hover:bg-ink-950/5 transition shadow-2xs"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Đăng nhập bằng Google</span>
                </button>

                <div className="flex items-center gap-3 my-2">
                  <div className="h-px flex-1 bg-ink-700/10" />
                  <span className="text-[11px] text-ink-700/40 uppercase font-mono">
                    Hoặc dùng Email
                  </span>
                  <div className="h-px flex-1 bg-ink-700/10" />
                </div>

                <form onSubmit={handleLogin} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-medium text-ink-700 mb-1">
                      Email công tác
                    </label>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nhansu@congty.com"
                      className="w-full rounded-xl border border-ink-700/20 bg-white px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-700 mb-1">
                      Mật khẩu
                    </label>
                    <input
                      required
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-ink-700/20 bg-white px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-ink-950 text-white py-2.5 text-sm font-medium hover:bg-ink-800 transition disabled:opacity-50 shadow-xs"
                  >
                    {loading ? "Đang xác thực..." : "Đăng nhập hệ thống"}
                  </button>
                </form>
              </div>
            ) : (
              /* Register Form UI */
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-ink-700 mb-1">
                    Họ và tên nhân sự <span className="text-flare-600">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="VD: Trần Văn B"
                    className="w-full rounded-xl border border-ink-700/20 bg-white px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-700 mb-1">
                    Email công việc <span className="text-flare-600">*</span>
                  </label>
                  <input
                    required
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="ten.nhansu@congty.com"
                    className="w-full rounded-xl border border-ink-700/20 bg-white px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-700 mb-1">
                    Phòng ban chuyên trách
                  </label>
                  <select
                    value={regDepartment}
                    onChange={(e) => setRegDepartment(e.target.value)}
                    className="w-full rounded-xl border border-ink-700/20 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal-500 text-ink-900"
                  >
                    <option value="support">Tư vấn & Hỗ trợ chung</option>
                    <option value="technical">Bộ phận Kỹ thuật</option>
                    <option value="billing">Bộ phận Kế toán & Thanh toán</option>
                    <option value="management">Quản lý Vận hành</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-700 mb-1">
                    Mật khẩu <span className="text-flare-600">*</span>
                  </label>
                  <input
                    required
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full rounded-xl border border-ink-700/20 bg-white px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-700 mb-1">
                    Xác nhận mật khẩu <span className="text-flare-600">*</span>
                  </label>
                  <input
                    required
                    type="password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    className="w-full rounded-xl border border-ink-700/20 bg-white px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-ink-950 text-white py-2.5 text-sm font-medium hover:bg-ink-800 transition shadow-xs mt-1"
                >
                  Tạo tài khoản nhân sự
                </button>
              </form>
            )}
          </div>

          <div className="px-6 py-3 bg-paper/60 border-t border-ink-700/10 text-center">
            <Link
              href="/"
              className="text-xs text-ink-700/60 hover:text-ink-950 font-mono transition"
            >
              ← Quay lại Trang chủ người dùng
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

