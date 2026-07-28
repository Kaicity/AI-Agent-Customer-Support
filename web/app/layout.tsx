import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tổng đài Hỗ trợ Tự vận hành",
  description: "Hệ thống tiếp nhận, phân loại và xử lý yêu cầu khách hàng đa kênh",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
