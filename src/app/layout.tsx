import "@/app/globals.css";
import React from "react";
import type { Metadata } from "next";
import { QueryProvider } from "@/components/providers/query-provider";

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
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
