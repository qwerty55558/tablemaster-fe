"use client"

import * as React from "react"
import {
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileDescription,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconClipboardList,
  IconCalendar,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavDocuments } from "@/components/nav-documents"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const staffData = {
  user: {
    name: "Staff User",
    email: "staff@example.com",
    avatar: "/avatars/staff.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/staff/dashboard",
      icon: IconDashboard,
    },
    {
      title: "My Tasks",
      url: "/staff/tasks",
      icon: IconClipboardList,
    },
    {
      title: "Schedule",
      url: "/staff/schedule",
      icon: IconCalendar,
    },
    {
      title: "Projects",
      url: "/staff/projects",
      icon: IconFolder,
    },
    {
      title: "Reports",
      url: "/staff/reports",
      icon: IconChartBar,
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: IconDatabase,
    },
    {
      name: "My Reports",
      url: "#",
      icon: IconReport,
    },
    {
      name: "Documents",
      url: "#",
      icon: IconFileDescription,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: IconSearch,
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
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Staff Portal</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={staffData.navMain} />
        <NavDocuments items={staffData.documents} />
        <NavSecondary items={staffData.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={staffData.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
