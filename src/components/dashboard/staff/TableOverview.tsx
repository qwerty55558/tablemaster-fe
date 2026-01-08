"use client"

import { IconMessageCircle, IconUsers } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

// 더미 데이터
const tables = [
  { id: 1, name: "A1", status: "active", guests: 4, male: 2, female: 2, region: "서울", chatEnabled: true, hasChat: true },
  { id: 2, name: "A2", status: "active", guests: 3, male: 1, female: 2, region: "부산", chatEnabled: true, hasChat: false },
  { id: 3, name: "A3", status: "empty", guests: 0, male: 0, female: 0, region: "", chatEnabled: false, hasChat: false },
  { id: 4, name: "B1", status: "active", guests: 6, male: 3, female: 3, region: "서울", chatEnabled: true, hasChat: true },
  { id: 5, name: "B2", status: "active", guests: 2, male: 1, female: 1, region: "인천", chatEnabled: false, hasChat: false },
  { id: 6, name: "B3", status: "empty", guests: 0, male: 0, female: 0, region: "", chatEnabled: false, hasChat: false },
  { id: 7, name: "C1", status: "active", guests: 5, male: 2, female: 3, region: "대구", chatEnabled: true, hasChat: true },
  { id: 8, name: "C2", status: "reserved", guests: 0, male: 0, female: 0, region: "", chatEnabled: false, hasChat: false },
]

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

export function TableOverview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>테이블 현황</CardTitle>
        <CardDescription>전체 테이블 상태를 한눈에 확인하세요</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {tables.map((table) => (
            <div
              key={table.id}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-lg border-2 p-4 transition-colors hover:bg-accent/50 cursor-pointer",
                statusStyles[table.status as keyof typeof statusStyles]
              )}
            >
              {/* 테이블 이름 */}
              <span className="text-lg font-bold">{table.name}</span>
              
              {/* 상태 배지 */}
              <Badge 
                variant="secondary" 
                className="mt-1 text-xs"
              >
                {statusLabels[table.status as keyof typeof statusLabels]}
              </Badge>

              {/* 이용중일 때 추가 정보 */}
              {table.status === "active" && (
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-0.5">
                    <IconUsers className="size-3" />
                    {table.guests}
                  </span>
                  {table.hasChat && (
                    <span className="flex items-center gap-0.5 text-green-600">
                      <IconMessageCircle className="size-3" />
                    </span>
                  )}
                </div>
              )}

              {/* 지역 표시 */}
              {table.region && (
                <span className="mt-1 text-xs text-muted-foreground">
                  {table.region}
                </span>
              )}
            </div>
          ))}
        </div>

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
