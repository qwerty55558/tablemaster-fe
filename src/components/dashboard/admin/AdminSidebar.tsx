"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  IconDashboard,
  IconUsers,
  IconShield,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { AdminHelpDialog } from "@/components/dashboard/admin/AdminHelpDialog"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { Logo } from "@/components/ui/logo"
import { Switch } from "@/components/ui/switch"

const adminData = {
  navMain: [
    {
      title: "대시보드",
      url: "/admin/dashboard",
      icon: IconDashboard,
    },
  ],
}

// 아이콘 애니메이션 variants
const iconVariants = {
  active: { 
    scale: 1.15, 
    opacity: 1,
  },
  inactive: { 
    scale: 0.9, 
    opacity: 0.4,
  }
}

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()

  const handleSwitchToStaff = () => {
    router.push("/staff/dashboard")
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/admin/dashboard">
                <Logo className="!size-5" />
                <span className="text-base font-semibold">TableMaster</span>
                <span className="ml-1 text-xs text-muted-foreground">Admin</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={adminData.navMain} />
        
        {/* 하단 그룹: 뷰 전환 + 도움말 */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Admin/Staff 뷰 전환 토글 - 컴팩트, 왼쪽 정렬, 스위치 고정 */}
              <SidebarMenuItem>
                <motion.div 
                  className="flex items-center gap-2 px-2 py-1.5"
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    variants={iconVariants}
                    animate="inactive"
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                  >
                    <IconUsers className="size-4 text-primary" />
                  </motion.div>
                  <Switch
                    checked={true}
                    onCheckedChange={handleSwitchToStaff}
                    className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted-foreground/30"
                  />
                  <motion.div
                    variants={iconVariants}
                    animate="active"
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                  >
                    <IconShield className="size-4 text-primary" />
                  </motion.div>
                </motion.div>
              </SidebarMenuItem>
              
              {/* 도움말 */}
              <SidebarMenuItem>
                <AdminHelpDialog />
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
