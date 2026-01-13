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
  IconDeviceTablet,
  IconX,
  IconTrash,
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
import { useNotifications } from "@/components/providers/admin-notification-provider"
import type { ActivityType } from "@/lib/websocket/types"

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
  "/admin/profile": "내 프로필",
}

const typeConfig: Record<ActivityType, { icon: typeof IconBell; color: string; bg: string }> = {
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
  device: {
    icon: IconDeviceTablet,
    color: "text-purple-600",
    bg: "bg-purple-500/10",
  },
}

export function SiteHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { notifications, unreadCount, isShaking, markAllAsRead, removeNotification, clearAllNotifications } = useNotifications()

  const pageTitle = pageTitles[pathname] || "Dashboard"

  const handleMarkAllAsRead = () => {
    markAllAsRead()
    setOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 bg-background flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
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
                <IconBell
                  className={cn(
                    "size-5 transition-transform",
                    isShaking && "animate-bounce"
                  )}
                />
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
              <div className="mt-4 px-2 space-y-4 max-h-[60vh] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <IconBell className="size-12 text-muted-foreground mb-3" />
                    <p className="text-sm font-medium text-foreground">
                      알림이 없습니다
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      새로운 알림이 오면 여기에 표시됩니다
                    </p>
                  </div>
                ) : (
                  notifications.map((activity) => {
                    const config = typeConfig[activity.type]
                    const Icon = config.icon

                    return (
                      <div
                        key={activity.id}
                        className={cn(
                          "group flex items-start gap-3 rounded-lg border p-4 transition-colors relative",
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 size-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeNotification(activity.id)}
                        >
                          <IconX className="size-3" />
                        </Button>
                      </div>
                    )
                  })
                )}
              </div>
              {notifications.length > 0 && (
                <div className="mt-4 pt-4 border-t flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={handleMarkAllAsRead}>
                    모두 읽음
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-destructive hover:text-destructive"
                    onClick={clearAllNotifications}
                  >
                    <IconTrash className="size-4 mr-1" />
                    모두 삭제
                  </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

