"use client"

import { useMemo } from "react"
import {
  IconLayoutGrid,
  IconMessageCircle,
  IconUsers,
  IconUserPlus,
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
import { useTables } from "@/hooks/use-tables"

function StatCardSkeleton() {
  return (
    <Card className="@container/card">
      <CardHeader>
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-16 mt-2" />
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-32" />
      </CardFooter>
    </Card>
  )
}

export function StaffStatsCards() {
  const { data: tables = [], isLoading } = useTables()

  // 테이블 데이터에서 통계 계산
  const stats = useMemo(() => {
    const totalTables = tables.length
    const activeTables = tables.filter((t) => t.status === "active").length
    const emptyTables = tables.filter((t) => t.status === "empty").length
    const reservedTables = tables.filter((t) => t.status === "reserved").length
    const inactiveTables = tables.filter((t) => t.status === "inactive").length

    // 현재 이용중인 테이블의 손님 집계
    const activeTableData = tables.filter((t) => t.status === "active")
    const todayGuests = activeTableData.reduce((sum, t) => sum + t.guestCount, 0)
    const maleGuests = activeTableData.reduce((sum, t) => sum + t.maleCount, 0)
    const femaleGuests = activeTableData.reduce((sum, t) => sum + t.femaleCount, 0)

    // 채팅 활성화된 테이블
    const activeChats = activeTableData.filter((t) => t.chatEnabled).length

    // 입장 대기 (예약 테이블)
    const pendingEntry = reservedTables

    // 점유율: 비활성 테이블 제외
    const availableTables = totalTables - inactiveTables
    const occupancyRate = availableTables > 0
      ? Math.round((activeTables / availableTables) * 100)
      : 0

    return {
      totalTables,
      activeTables,
      emptyTables,
      inactiveTables,
      todayGuests,
      maleGuests,
      femaleGuests,
      activeChats,
      pendingEntry,
      occupancyRate,
    }
  }, [tables])

  if (isLoading) {
    return (
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  const {
    totalTables,
    activeTables,
    emptyTables,
    inactiveTables,
    todayGuests,
    maleGuests,
    femaleGuests,
    activeChats,
    pendingEntry,
    occupancyRate,
  } = stats

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* 테이블 현황 */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>테이블 현황</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {activeTables}/{totalTables}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconLayoutGrid className="size-3" />
              {occupancyRate}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            빈 테이블 {emptyTables}개{inactiveTables > 0 && ` · 비활성 ${inactiveTables}개`}
          </div>
          <div className="text-muted-foreground">이용 중인 테이블 수</div>
        </CardFooter>
      </Card>

      {/* 현재 손님 */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>현재 손님</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {todayGuests}명
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconUsers className="size-3" />
              Live
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            남 {maleGuests} · 여 {femaleGuests}
          </div>
          <div className="text-muted-foreground">성별 비율</div>
        </CardFooter>
      </Card>

      {/* 활성 채팅 */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>활성 채팅</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {activeChats}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-green-600 border-green-600/50">
              <IconMessageCircle className="size-3" />
              Live
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            진행 중인 대화
          </div>
          <div className="text-muted-foreground">테이블 간 채팅 수</div>
        </CardFooter>
      </Card>

      {/* 입장 대기 */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>입장 대기</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {pendingEntry}팀
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className={pendingEntry > 0 ? "text-amber-600 border-amber-600/50" : ""}
            >
              <IconUserPlus className="size-3" />
              대기
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {pendingEntry > 0 ? "입장 처리 필요" : "대기 없음"}
          </div>
          <div className="text-muted-foreground">입장 대기 중인 팀</div>
        </CardFooter>
      </Card>
    </div>
  )
}
