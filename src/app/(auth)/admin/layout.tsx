import React from "react"
import { AdminSidebar } from "@/components/dashboard/admin/AdminSidebar"
import { SiteHeader } from "@/components/site-header"
import { PageTransitionWrapper } from "@/components/motion/PageTransitionWrapper"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AdminSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <PageTransitionWrapper className="@container/main flex flex-1 flex-col gap-2 mx-auto w-full max-w-7xl">
            {children}
          </PageTransitionWrapper>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
