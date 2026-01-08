"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import {
  IconBell,
  IconGift,
  IconMessageCircle,
  IconUserMinus,
  IconUserPlus,
  IconAlertTriangle,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

// 페이지별 타이틀 매핑
const pageTitles: Record<string, string> = {
  "/staff/dashboard": "대시보드",
  "/staff/tables": "테이블 관리",
  "/staff/entry": "입장 등록",
  "/staff/chat-monitor": "채팅 모니터",
  "/staff/moderation": "채팅 관리",
  "/staff/stats": "통계",
  "/staff/profile": "내 프로필",
  "/admin/dashboard": "관리자 대시보드",
}

// 더미 활동 데이터
const activities = [
  {
    id: 1,
    type: "entry",
    message: "A5 테이블에 4명(남2, 여2) 입장",
    time: "방금 전",
    staff: "김스태프",
    isNew: true,
  },
  {
    id: 2,
    type: "chat",
    message: "B2 ↔ C1 테이블 채팅 시작",
    time: "2분 전",
    staff: null,
    isNew: true,
  },
  {
    id: 3,
    type: "gift",
    message: "A1 → B3 테이블로 와인 선물",
    time: "5분 전",
    staff: null,
    isNew: true,
  },
  {
    id: 4,
    type: "warning",
    message: "D2 테이블 채팅에서 금칙어 감지",
    time: "8분 전",
    staff: null,
    isNew: false,
  },
  {
    id: 5,
    type: "exit",
    message: "C4 테이블 퇴장 처리",
    time: "12분 전",
    staff: "이스태프",
    isNew: false,
  },
  {
    id: 6,
    type: "entry",
    message: "B1 테이블에 3명(남1, 여2) 입장",
    time: "15분 전",
    staff: "김스태프",
    isNew: false,
  },
  {
    id: 7,
    type: "chat",
    message: "A2 ↔ D1 테이블 채팅 종료",
    time: "20분 전",
    staff: null,
    isNew: false,
  },
  {
    id: 8,
    type: "gift",
    message: "C1 → A1 테이블로 맥주 선물",
    time: "25분 전",
    staff: null,
    isNew: false,
  },
]

const typeConfig = {
  entry: {
    icon: IconUserPlus,
    color: "text-green-600",
    bg: "bg-green-500/10",
  },
  exit: {
    icon: IconUserMinus,
    color: "text-muted-foreground",
    bg: "bg-muted",
  },
  chat: {
    icon: IconMessageCircle,
    color: "text-blue-600",
    bg: "bg-blue-500/10",
  },
  warning: {
    icon: IconAlertTriangle,
    color: "text-amber-600",
    bg: "bg-amber-500/10",
  },
  gift: {
    icon: IconGift,
    color: "text-pink-600",
    bg: "bg-pink-500/10",
  },
}

export function SiteHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const unreadCount = activities.filter((a) => a.isNew).length

  // 현재 페이지 타이틀 가져오기
  const pageTitle = pageTitles[pathname] || "Dashboard"

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{pageTitle}</h1>
        <div className="ml-auto flex items-center gap-2">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <IconBell className="size-5" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 size-5 p-0 justify-center text-xs"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-100 sm:w-112.5">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <IconBell className="size-5" />
                  최근 활동
                </SheetTitle>
                <SheetDescription>
                  실시간 매장 활동 알림
                </SheetDescription>
              </SheetHeader>
              <div className="mt-4 px-2 space-y-4">
                {activities.map((activity) => {
                  const config = typeConfig[activity.type as keyof typeof typeConfig]
                  const Icon = config.icon

                  return (
                    <div
                      key={activity.id}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border p-4 transition-colors",
                        activity.isNew && "bg-accent/50"
                      )}
                    >
                      <div className={cn("rounded-full p-2", config.bg)}>
                        <Icon className={cn("size-4", config.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium">{activity.message}</p>
                          {activity.isNew && (
                            <Badge variant="secondary" className="text-xs shrink-0">
                              NEW
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {activity.time}
                          </span>
                          {activity.staff && (
                            <span className="text-xs text-muted-foreground">
                              · {activity.staff}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 pt-4 border-t">
                <Button variant="outline" className="w-full" onClick={() => setOpen(false)}>
                  모두 읽음 처리
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
