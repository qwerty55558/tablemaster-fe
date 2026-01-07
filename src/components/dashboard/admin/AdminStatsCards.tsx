"use client"

import {
  IconTrendingDown,
  IconTrendingUp,
  IconUsers,
  IconUserPlus,
  IconShield,
  IconAlertCircle,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAdminDashboardMetrics } from "@/hooks/use-metrics"
import { cn } from "@/lib/utils"

function StatsCardSkeleton() {
  return (
    <Card className="@container/card">
      <CardHeader>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-20 mt-2" />
        <CardAction>
          <Skeleton className="h-5 w-16" />
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-28" />
      </CardFooter>
    </Card>
  )
}

function ErrorCard({ message }: { message: string }) {
  return (
    <Card className="@container/card border-destructive/50">
      <CardHeader>
        <CardDescription className="text-destructive flex items-center gap-2">
          <IconAlertCircle className="size-4" />
          데이터 로드 실패
        </CardDescription>
        <CardTitle className="text-lg text-muted-foreground">--</CardTitle>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="text-destructive text-xs">{message}</div>
      </CardFooter>
    </Card>
  )
}

export function AdminStatsCards() {
  const { data: metrics, isLoading, isError, error } = useAdminDashboardMetrics()

  if (isLoading) {
    return (
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <ErrorCard message={error?.message || "Unknown error"} />
        <ErrorCard message={error?.message || "Unknown error"} />
        <ErrorCard message={error?.message || "Unknown error"} />
        <ErrorCard message={error?.message || "Unknown error"} />
      </div>
    )
  }

  const {
    totalUsers,
    totalUsersChange,
    activeStaff,
    activeStaffOnline,
    systemHealth,
    systemHealthStatus,
    pendingApprovals,
    pendingApprovalsChange,
  } = metrics!

  const formatNumber = (num: number): string => {
    if (num >= 10000) {
      return (num / 1000).toFixed(1) + "K"
    }
    return num.toLocaleString()
  }

  const getChangeIcon = (change: number) =>
    change >= 0 ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />

  const getHealthStatusBadge = (status: typeof systemHealthStatus) => {
    switch (status) {
      case "stable":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600/50">
            <IconShield />
            Stable
          </Badge>
        )
      case "warning":
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600/50">
            <IconShield />
            Warning
          </Badge>
        )
      case "critical":
        return (
          <Badge variant="outline" className="text-red-600 border-red-600/50">
            <IconAlertCircle />
            Critical
          </Badge>
        )
    }
  }

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* Total Users */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Users</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatNumber(totalUsers)}
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className={cn(
                totalUsersChange >= 0
                  ? "text-green-600 border-green-600/50"
                  : "text-red-600 border-red-600/50"
              )}
            >
              {getChangeIcon(totalUsersChange)}
              {totalUsersChange >= 0 ? "+" : ""}
              {totalUsersChange}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            User growth steady {getChangeIcon(totalUsersChange)}
          </div>
          <div className="text-muted-foreground">Total registered users</div>
        </CardFooter>
      </Card>

      {/* Active Staff */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Staff</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {activeStaff}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconUsers />
              Online
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {activeStaffOnline} currently active <IconUserPlus className="size-4" />
          </div>
          <div className="text-muted-foreground">Staff members online now</div>
        </CardFooter>
      </Card>

      {/* System Health */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>System Health</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {systemHealth}%
          </CardTitle>
          <CardAction>{getHealthStatusBadge(systemHealthStatus)}</CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {systemHealthStatus === "stable"
              ? "All systems operational"
              : systemHealthStatus === "warning"
                ? "Some issues detected"
                : "Immediate attention needed"}
            {systemHealthStatus === "stable" && <IconTrendingUp className="size-4" />}
          </div>
          <div className="text-muted-foreground">Uptime this month</div>
        </CardFooter>
      </Card>

      {/* Pending Approvals */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Pending Approvals</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {pendingApprovals}
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className={cn(
                pendingApprovalsChange <= 0
                  ? "text-green-600 border-green-600/50"
                  : "text-red-600 border-red-600/50"
              )}
            >
              {getChangeIcon(pendingApprovalsChange)}
              {pendingApprovalsChange >= 0 ? "+" : ""}
              {pendingApprovalsChange}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {pendingApprovals > 0 ? "Requires attention" : "All caught up!"}{" "}
            {getChangeIcon(pendingApprovalsChange)}
          </div>
          <div className="text-muted-foreground">Items awaiting review</div>
        </CardFooter>
      </Card>
    </div>
  )
}
