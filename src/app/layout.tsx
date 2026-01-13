import "@/app/globals.css";
import React from "react";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "@/components/ui/sonner";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { AdminNotificationProvider } from "@/components/providers/admin-notification-provider";
import { SessionExpiredHandler } from "@/components/session-expired-handler";

const kakaoBigSans = localFont({
  src: [
    {
      path: "../fonts/KakaoBigSans-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/KakaoBigSans-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-kakao",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TableMaster - 테이블 관리의 모든 것을 쉽게",
  description: "복잡한 테이블 관리를 단순하게. TableMaster와 함께라면 당신의 업무가 새로워질 거예요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`dark ${kakaoBigSans.variable}`}>
      <body className="antialiased select-none">
        <AuthSessionProvider>
          <QueryProvider>
            <AdminNotificationProvider>
              {children}
              <SessionExpiredHandler />
            </AdminNotificationProvider>
          </QueryProvider>
        </AuthSessionProvider>
        <Toaster />
      </body>
    </html>
  );
}
