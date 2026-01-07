"use client"

import {
  IconTrendingDown,
  IconTrendingUp,
  IconClipboardCheck,
  IconClock,
  IconCalendarEvent,
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
import { useStaffDashboardMetrics } from "@/hooks/use-metrics"
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

interface StaffStatsCardsProps {
  userId?: string
}

export function StaffStatsCards({ userId }: StaffStatsCardsProps) {
  const { data: metrics, isLoading, isError, error } = useStaffDashboardMetrics(userId)

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
    myTasks,
    tasksDueToday,
    completedTasks,
    completedTasksChange,
    hoursLogged,
    weeklyTarget,
    upcomingEvents,
    nextEventName,
  } = metrics!

  const getChangeIcon = (change: number) =>
    change >= 0 ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />

  const hoursProgress = Math.round((hoursLogged / weeklyTarget) * 100)
  const isOnTrack = hoursProgress >= 70

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* My Tasks */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>My Tasks</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {myTasks}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconClipboardCheck />
              Active
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {tasksDueToday} due today <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Assigned tasks this week</div>
        </CardFooter>
      </Card>

      {/* Completed Tasks */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Completed Tasks</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {completedTasks}
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className={cn(
                completedTasksChange >= 0
                  ? "text-green-600 border-green-600/50"
                  : "text-red-600 border-red-600/50"
              )}
            >
              {getChangeIcon(completedTasksChange)}
              {completedTasksChange >= 0 ? "+" : ""}
              {completedTasksChange}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {completedTasksChange >= 0 ? "Great progress!" : "Keep going!"}{" "}
            {getChangeIcon(completedTasksChange)}
          </div>
          <div className="text-muted-foreground">Completed this month</div>
        </CardFooter>
      </Card>

      {/* Hours Logged */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Hours Logged</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {hoursLogged}h
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconClock />
              This Week
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {isOnTrack ? "On track" : "Need to catch up"}{" "}
            {isOnTrack ? (
              <IconTrendingUp className="size-4" />
            ) : (
              <IconTrendingDown className="size-4" />
            )}
          </div>
          <div className="text-muted-foreground">
            Weekly target: {weeklyTarget}h ({hoursProgress}%)
          </div>
        </CardFooter>
      </Card>

      {/* Upcoming Events */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Upcoming Events</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {upcomingEvents}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconCalendarEvent />
              Today
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {upcomingEvents > 0 ? `Next: ${nextEventName}` : "No events today"}
          </div>
          <div className="text-muted-foreground">Scheduled for today</div>
        </CardFooter>
      </Card>
    </div>
  )
}
