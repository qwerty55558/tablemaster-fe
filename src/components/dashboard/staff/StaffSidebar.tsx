"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import {
  IconChartBar,
  IconDashboard,
  IconLayoutGrid,
  IconMessageCircle,
  IconUserPlus,
  IconShieldCheck,
  IconUsers,
  IconShield,
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
import { Switch } from "@/components/ui/switch"

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

export function StaffSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  const { data: session } = useSession()
  const isAdmin = session?.user?.roles?.includes("ROLE_ADMIN")

  const handleSwitchToAdmin = () => {
    router.push("/admin/dashboard")
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
        
        {/* 하단 그룹: 뷰 전환 (Admin만) + 도움말 */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Admin/Staff 뷰 전환 토글 - Admin 사용자만 표시, 컴팩트, 왼쪽 정렬, 스위치 고정 */}
              {isAdmin && (
                <SidebarMenuItem>
                  <motion.div 
                    className="flex items-center gap-2 px-2 py-1.5"
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.div
                      variants={iconVariants}
                      animate="active"
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                      <IconUsers className="size-4 text-primary" />
                    </motion.div>
                    <Switch
                      checked={false}
                      onCheckedChange={handleSwitchToAdmin}
                      className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted-foreground/30"
                    />
                    <motion.div
                      variants={iconVariants}
                      animate="inactive"
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                      <IconShield className="size-4 text-primary" />
                    </motion.div>
                  </motion.div>
                </SidebarMenuItem>
              )}
              
              {/* 도움말 */}
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
