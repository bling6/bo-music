import type { Metadata } from "next";
import { ClientLayout } from "@/components/layout/client-layout";
import "./globals.css";

export const metadata: Metadata = {
  title: "BO-Music | AI Music Creation",
  description: "用 AI 创作属于你的音乐 - 输入描述或歌词，AI 为你谱曲、写词、生成封面",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-black text-white font-sans">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
