"use client"

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
import { StaggerContainer, StaggerItem } from "@/components/motion"

// 더미 데이터 - 나중에 API 연동
const mockData = {
  totalTables: 24,
  activeTables: 18,
  emptyTables: 6,
  todayGuests: 156,
  maleGuests: 82,
  femaleGuests: 74,
  activeChats: 12,
  pendingEntry: 3,
}

export function StaffStatsCards() {
  const {
    totalTables,
    activeTables,
    emptyTables,
    todayGuests,
    maleGuests,
    femaleGuests,
    activeChats,
    pendingEntry,
  } = mockData

  const occupancyRate = Math.round((activeTables / totalTables) * 100)

  return (
    <StaggerContainer className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* 테이블 현황 */}
      <StaggerItem>
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
              빈 테이블 {emptyTables}개
            </div>
            <div className="text-muted-foreground">이용 중인 테이블 수</div>
          </CardFooter>
        </Card>
      </StaggerItem>

      {/* 오늘 입장객 */}
      <StaggerItem>
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>오늘 입장객</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {todayGuests}명
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <IconUsers className="size-3" />
                Today
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
      </StaggerItem>

      {/* 활성 채팅 */}
      <StaggerItem>
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
      </StaggerItem>

      {/* 입장 대기 */}
      <StaggerItem>
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
      </StaggerItem>
    </StaggerContainer>
  )
}
