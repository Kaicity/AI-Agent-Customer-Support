"use client";

import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

export const LogoutButton = () => {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  return (
    <button
      className="bg-white rounded-lg text-black w-full py-3 font-medium hover:transition-all hover:duration-300 hover:scale-105"
      onClick={handleLogout}
    >
      Đăng xuất
    </button>
  );
};
