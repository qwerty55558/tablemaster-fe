"use client"

import * as React from "react"
import {
  IconChartBar,
  IconDashboard,
  IconLayoutGrid,
  IconMessageCircle,
  IconUserPlus,
  IconShieldCheck,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { HelpDialog } from "@/components/dashboard/staff/HelpDialog"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Logo } from "@/components/ui/logo"

const staffData = {
  navMain: [
    {
      title: "대시보드",
      url: "/staff/dashboard",
      icon: IconDashboard,
    },
    {
      title: "테이블 관리",
      url: "/staff/tables",
      icon: IconLayoutGrid,
    },
    {
      title: "입장 등록",
      url: "/staff/entry",
      icon: IconUserPlus,
    },
    {
      title: "채팅 모니터",
      url: "/staff/chat-monitor",
      icon: IconMessageCircle,
    },
    {
      title: "채팅 관리",
      url: "/staff/moderation",
      icon: IconShieldCheck,
    },
    {
      title: "통계",
      url: "/staff/stats",
      icon: IconChartBar,
    },
  ],
}

export function StaffSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/staff/dashboard">
                <Logo className="!size-5" />
                <span className="text-base font-semibold">TableMaster</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={staffData.navMain} />
        
        {/* 도움말 - 하단에 배치 */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <HelpDialog />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
