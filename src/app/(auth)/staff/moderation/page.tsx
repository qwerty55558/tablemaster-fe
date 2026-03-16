"use client"

import { useState } from "react"
import {
  IconAlertTriangle,
  IconBan,
  IconCheck,
  IconEye,
  IconFilter,
  IconSearch,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

// 금칙어 더미 데이터
const bannedWords = [
  { id: 1, word: "욕설1", category: "욕설", createdAt: "2024-01-05" },
  { id: 2, word: "욕설2", category: "욕설", createdAt: "2024-01-05" },
  { id: 3, word: "광고문구", category: "광고", createdAt: "2024-01-06" },
  { id: 4, word: "연락처유도", category: "개인정보", createdAt: "2024-01-07" },
]

// 제재 로그 더미 데이터
const moderationLogs = [
  { 
    id: 1, 
    tables: "A1 ↔ B1", 
    reason: "부적절한 언어 사용",
    action: "warning",
    timestamp: "2024-01-08 21:05",
    staff: "김스태프",
  },
  { 
    id: 2, 
    tables: "C1 ↔ D2", 
    reason: "개인정보 요청 시도",
    action: "muted",
    timestamp: "2024-01-08 20:30",
    staff: "이스태프",
  },
  { 
    id: 3, 
    tables: "A2", 
    reason: "반복적인 규정 위반",
    action: "banned",
    timestamp: "2024-01-08 19:45",
    staff: "박스태프",
  },
]

const actionLabels = {
  warning: "경고",
  muted: "채팅제한",
  banned: "이용정지",
} as const

const actionStyles = {
  warning: "bg-amber-500/20 text-amber-700 dark:text-amber-400",
  muted: "bg-orange-500/20 text-orange-700 dark:text-orange-400",
  banned: "bg-red-500/20 text-red-700 dark:text-red-400",
} as const

export default function ModerationPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterAction, setFilterAction] = useState<string>("all")

  const filteredLogs = moderationLogs.filter((log) => {
    const matchesSearch = log.tables.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterAction === "all" || log.action === filterAction
    return matchesSearch && matchesFilter
  })

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6 space-y-6">
        {/* 금칙어 관리 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>금칙어 관리</CardTitle>
                <CardDescription>자동 필터링되는 금칙어 목록</CardDescription>
              </div>
              <Button>
                금칙어 추가
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {bannedWords.map((item) => (
                <Badge 
                  key={item.id} 
                  variant="secondary"
                  className="px-3 py-1.5 text-sm"
                >
                  {item.word}
                  <button className="ml-2 hover:text-destructive">×</button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 제재 로그 */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>제재 로그</CardTitle>
                <CardDescription>채팅 제재 이력 관리</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <IconSearch className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    placeholder="테이블 검색..."
                    className="pl-8 w-[180px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={filterAction} onValueChange={setFilterAction}>
                  <SelectTrigger className="w-[120px]">
                    <IconFilter className="size-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="warning">경고</SelectItem>
                    <SelectItem value="muted">채팅제한</SelectItem>
                    <SelectItem value="banned">이용정지</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>테이블</TableHead>
                  <TableHead>사유</TableHead>
                  <TableHead>조치</TableHead>
                  <TableHead>처리일시</TableHead>
                  <TableHead>처리자</TableHead>
                  <TableHead className="text-right">상세</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.tables}</TableCell>
                    <TableCell>{log.reason}</TableCell>
                    <TableCell>
                      <Badge className={cn("font-normal", actionStyles[log.action as keyof typeof actionStyles])}>
                        {actionLabels[log.action as keyof typeof actionLabels]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{log.timestamp}</TableCell>
                    <TableCell>{log.staff}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <IconEye className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
