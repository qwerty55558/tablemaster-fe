"use client"

import { IconMessageCircle, IconUsers, IconRefresh, IconAlertCircle } from "@tabler/icons-react"
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
import { useTables, tableKeys } from "@/hooks/use-tables"
import { useQueryClient } from "@tanstack/react-query"

const statusStyles = {
  active: "bg-green-500/20 border-green-500/50 text-green-700 dark:text-green-400",
  empty: "bg-muted border-muted-foreground/20 text-muted-foreground",
  reserved: "bg-amber-500/20 border-amber-500/50 text-amber-700 dark:text-amber-400",
} as const

const statusLabels = {
  active: "이용중",
  empty: "빈테이블",
  reserved: "예약",
} as const

function TableSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-lg" />
      ))}
    </div>
  )
}

export function TableOverview() {
  const queryClient = useQueryClient()
  const { data: tables = [], isLoading, isFetching, isError, error } = useTables()

  if (isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <IconAlertCircle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-lg font-medium text-destructive mb-2">
            테이블 정보를 불러오는데 실패했습니다
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            {error?.message || "알 수 없는 오류가 발생했습니다"}
          </p>
          <Button
            onClick={() => queryClient.invalidateQueries({ queryKey: tableKeys.list() })}
            variant="outline"
          >
            <IconRefresh className="mr-2 h-4 w-4" />
            다시 시도
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>테이블 현황</CardTitle>
          <CardDescription>전체 테이블 상태를 한눈에 확인하세요</CardDescription>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => queryClient.invalidateQueries({ queryKey: tableKeys.list() })}
          disabled={isFetching}
        >
          <IconRefresh className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <TableSkeleton />
        ) : tables.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p>등록된 테이블이 없습니다</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {tables.map((table, index) => (
              <div
                key={table.tableId || index}
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-lg border-2 p-4 transition-colors hover:bg-accent/50 cursor-pointer",
                  statusStyles[table.status]
                )}
              >
                {/* 테이블 이름 */}
                <span className="text-lg font-bold">{table.tableName}</span>

                {/* 상태 배지 */}
                <Badge
                  variant="secondary"
                  className="mt-1 text-xs"
                >
                  {statusLabels[table.status]}
                </Badge>

                {/* 이용중일 때 추가 정보 */}
                {table.status === "active" && (
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-0.5">
                      <IconUsers className="size-3" />
                      {table.guestCount}
                    </span>
                    {table.chatEnabled && (
                      <span className="flex items-center gap-0.5 text-green-600">
                        <IconMessageCircle className="size-3" />
                      </span>
                    )}
                  </div>
                )}

                {/* 지역 표시 */}
                {table.location && (
                  <span className="mt-1 text-xs text-muted-foreground">
                    {table.location}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 범례 */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="size-3 rounded-sm bg-green-500/20 border border-green-500/50" />
            <span>이용중</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-3 rounded-sm bg-muted border border-muted-foreground/20" />
            <span>빈테이블</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-3 rounded-sm bg-amber-500/20 border border-amber-500/50" />
            <span>예약</span>
          </div>
          <div className="flex items-center gap-1.5">
            <IconMessageCircle className="size-3 text-green-600" />
            <span>채팅중</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
