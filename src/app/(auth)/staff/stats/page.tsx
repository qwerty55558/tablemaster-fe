"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  IconCalendar,
  IconMessageCircle,
  IconRefresh,
  IconUserPlus,
  IconUsers,
} from "@tabler/icons-react"

import { fetchAnalyticsSummary } from "@/lib/api/analytics"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

function formatDate(dateString?: string | null) {
  if (!dateString) return "-"
  // "2026-03-27T23:59:59.999" → "2026-03-27"로 날짜 부분만 추출
  const dateOnly = dateString.split("T")[0]
  const parts = dateOnly.split("-")
  if (parts.length === 3) {
    return `${parts[0]}. ${parts[1]}. ${parts[2]}.`
  }
  return dateOnly
}

export default function StatsPage() {
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["analytics", "summary", "staff"],
    queryFn: () => fetchAnalyticsSummary(),
    staleTime: 0,
    refetchOnWindowFocus: false,
  })

  const maxEnterCount = useMemo(
    () => Math.max(1, ...(data?.daily.map((item) => item.visitorEnterCount) ?? [0])),
    [data]
  )

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="space-y-6 px-4 lg:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">통계</h1>
            <p className="text-sm text-muted-foreground">
              통계 요약 API 기준 실데이터입니다.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <IconCalendar className="size-3" />
              최종 반영일 {formatDate(data?.to)}
            </Badge>
            <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
              <IconRefresh className={cn("size-4", isFetching && "animate-spin")} />
            </Button>
          </div>
        </div>

        {error && (
          <Card>
            <CardContent className="py-6 text-sm text-destructive">
              {error instanceof Error ? error.message : "통계 조회에 실패했습니다."}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-32 rounded-xl" />
            ))
          ) : (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>입장 건수</CardDescription>
                  <CardTitle className="text-2xl">{data?.visitor.enterCount ?? 0}건</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <IconUserPlus className="size-4" />
                    퇴장 {data?.visitor.exitCount ?? 0}건
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>누적 방문 인원</CardDescription>
                  <CardTitle className="text-2xl">{data?.visitor.totalGuestCount ?? 0}명</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <IconUsers className="size-4" />
                    재연결 {data?.visitor.reconnectCount ?? 0}건
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>채팅 메시지</CardDescription>
                  <CardTitle className="text-2xl">{data?.chat.messageCount ?? 0}건</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <IconMessageCircle className="size-4" />
                    방 생성 {data?.chat.roomCreatedCount ?? 0}건
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>신고/선물</CardDescription>
                  <CardTitle className="text-2xl">
                    {data?.chat.reportCount ?? 0} / {data?.chat.giftCount ?? 0}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    신고 건수 / 선물 건수
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>기간별 입장 추이</CardTitle>
                <CardDescription>
                  {data
                    ? `${formatDate(data.from)} ~ ${formatDate(data.to)}`
                    : "최근 7일 기준"}
                </CardDescription>
              </div>
              <Badge variant="outline">
                업데이트 {data?.visitor.updateCount ?? 0}건
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[220px] rounded-xl" />
            ) : !data || data.daily.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                표시할 추이 데이터가 없습니다.
              </div>
            ) : (
              <div className="flex h-[220px] items-end justify-between gap-2">
                {data.daily.map((item) => (
                  <div key={item.date} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex w-full flex-col items-center gap-1">
                      <span className="text-xs font-medium">{item.visitorEnterCount}</span>
                      <div
                        className="w-full rounded-t bg-primary/80"
                        style={{
                          height: `${(item.visitorEnterCount / maxEnterCount) * 150}px`,
                          minHeight: "20px",
                        }}
                      />
                      <span className="text-[11px] text-muted-foreground">
                        메시지 {item.chatMessageCount}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {item.date.slice(5)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>방문 요약</CardTitle>
              <CardDescription>선택 기간 기준 방문 로그 집계</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <Skeleton className="h-44 rounded-xl" />
              ) : (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">입장</span>
                    <span className="font-medium">{data?.visitor.enterCount ?? 0}건</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">퇴장</span>
                    <span className="font-medium">{data?.visitor.exitCount ?? 0}건</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">재연결</span>
                    <span className="font-medium">{data?.visitor.reconnectCount ?? 0}건</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">수정</span>
                    <span className="font-medium">{data?.visitor.updateCount ?? 0}건</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">누적 방문 인원</span>
                    <span className="font-medium">{data?.visitor.totalGuestCount ?? 0}명</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>채팅 요약</CardTitle>
              <CardDescription>선택 기간 기준 채팅 로그 집계</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <Skeleton className="h-44 rounded-xl" />
              ) : (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">방 생성</span>
                    <span className="font-medium">{data?.chat.roomCreatedCount ?? 0}건</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">방 종료</span>
                    <span className="font-medium">{data?.chat.roomClosedCount ?? 0}건</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">메시지</span>
                    <span className="font-medium">{data?.chat.messageCount ?? 0}건</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">선물</span>
                    <span className="font-medium">{data?.chat.giftCount ?? 0}건</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">신고</span>
                    <span className="font-medium">{data?.chat.reportCount ?? 0}건</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
