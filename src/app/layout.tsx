import "@/app/globals.css";
import React from "react";
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { SessionExpiredHandler } from "@/components/session-expired-handler";

export const metadata: Metadata = {
  title: "TableMaster - 데이터 관리의 모든 것을 쉽게",
  description: "복잡한 데이터 관리를 단순하게. TableMaster와 함께라면 당신의 업무가 새로워질 거예요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <body className="antialiased">
        <AuthSessionProvider>
          <QueryProvider>
            {children}
            <SessionExpiredHandler />
          </QueryProvider>
        </AuthSessionProvider>
        <Toaster />
      </body>
    </html>
  );
}
