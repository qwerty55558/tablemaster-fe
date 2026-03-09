"use client"

import { useState, useMemo } from "react"
import {
  IconFilter,
  IconMessageCircle,
  IconMessageOff,
  IconSearch,
  IconUsers,
  IconUserMinus,
  IconClock,
  IconAlertCircle,
  IconLoader2,
  IconRefresh,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useTables, useDeleteTable } from "@/hooks/use-tables"
import type { Table as TableType } from "@/lib/api/tables"
import { toast } from "sonner"

const statusLabels = {
  active: "이용중",
  empty: "빈테이블",
  reserved: "예약",
  inactive: "비활성",
} as const

const statusStyles = {
  active: "bg-green-500/20 text-green-700 dark:text-green-400",
  empty: "bg-muted text-muted-foreground",
  reserved: "bg-amber-500/20 text-amber-700 dark:text-amber-400",
  inactive: "bg-red-500/10 text-red-600 dark:text-red-400",
} as const

function formatTime(dateString?: string): string {
  if (!dateString) return "-"
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function formatDuration(dateString?: string): string {
  if (!dateString) return "-"
  const start = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - start.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const hours = Math.floor(diffMins / 60)
  const mins = diffMins % 60

  if (hours > 0) {
    return `${hours}시간 ${mins}분`
  }
  return `${mins}분`
}

export default function TablesPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const { data: tables = [], isLoading, isError, error, refetch, isFetching } = useTables()
  const deleteTable = useDeleteTable()

  const filteredTables = useMemo(() => {
    return tables.filter((table) => {
      const matchesStatus = statusFilter === "all" || table.status === statusFilter
      const matchesSearch =
        table.tableName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        table.deviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        table.location.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesStatus && matchesSearch
    })
  }, [tables, statusFilter, searchQuery])

  const selectedTable = useMemo(() => {
    if (!selectedTableId) return null
    return tables.find((t) => t.tableId === selectedTableId) ?? null
  }, [selectedTableId, tables])

  const handleOpenDetail = (table: TableType) => {
    setSelectedTableId(table.tableId)
    setDetailOpen(true)
  }

  const handleExit = async () => {
    if (!selectedTable) return
    try {
      await deleteTable.mutateAsync(selectedTable.tableId)
      toast.success(`${selectedTable.tableName} 테이블 퇴장 처리되었습니다`)
      setDetailOpen(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : "퇴장 처리에 실패했습니다"
      toast.error(message)
    }
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <IconAlertCircle className="h-12 w-12 text-destructive mb-4" />
              <p className="text-lg font-medium text-destructive mb-2">
                데이터를 불러오는데 실패했습니다
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {error?.message || "알 수 없는 오류가 발생했습니다"}
              </p>
              <Button onClick={() => refetch()} variant="outline">
                <IconRefresh className="mr-2 h-4 w-4" />
                다시 시도
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>테이블 관리</CardTitle>
                <CardDescription>전체 테이블 목록 및 상태 관리</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <IconSearch className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    placeholder="테이블 검색..."
                    className="pl-8 w-[200px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[130px]">
                    <IconFilter className="size-4 mr-2" />
                    <SelectValue placeholder="상태 필터" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="active">이용중</SelectItem>
                    <SelectItem value="empty">빈테이블</SelectItem>
                    <SelectItem value="reserved">예약</SelectItem>
                    <SelectItem value="inactive">비활성</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => refetch()}
                  disabled={isFetching}
                >
                  <IconRefresh className={cn("size-4", isFetching && "animate-spin")} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>테이블</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>인원</TableHead>
                      <TableHead>성비</TableHead>
                      <TableHead>지역</TableHead>
                      <TableHead>입장시간</TableHead>
                      <TableHead>이용시간</TableHead>
                      <TableHead>채팅</TableHead>
                      <TableHead className="text-right">액션</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTables.map((table) => (
                      <TableRow key={table.tableId}>
                        <TableCell className="font-medium">{table.deviceName}</TableCell>
                        <TableCell>
                          <Badge className={cn("font-normal", statusStyles[table.status])}>
                            {statusLabels[table.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {table.guestCount > 0 ? (
                            <span className="flex items-center gap-1">
                              <IconUsers className="size-4" />
                              {table.guestCount}명
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {table.guestCount > 0 ? (
                            <span>남 {table.maleCount} / 여 {table.femaleCount}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {table.location || <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell>
                          {table.entryTime ? (
                            <span className="flex items-center gap-1">
                              <IconClock className="size-3.5" />
                              {formatTime(table.entryTime)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {table.entryTime ? (
                            <span>{formatDuration(table.entryTime)}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {table.chatEnabled ? (
                            <IconMessageCircle className="size-4 text-green-600" />
                          ) : (
                            <IconMessageOff className="size-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDetail(table)}
                          >
                            상세
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {filteredTables.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground">
                    {tables.length === 0 ? "등록된 테이블이 없습니다" : "검색 결과가 없습니다"}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 테이블 상세 모달 */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedTable?.deviceName} 상세</DialogTitle>
            <DialogDescription>
              테이블 정보 및 관리
            </DialogDescription>
          </DialogHeader>

          {selectedTable && (
            <div className="space-y-4">
              {/* 상태 */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">상태</span>
                <Badge className={cn("font-normal", statusStyles[selectedTable.status])}>
                  {statusLabels[selectedTable.status]}
                </Badge>
              </div>

              {selectedTable.status === "active" && (
                <>
                  <Separator />

                  {/* 인원 정보 */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">총 인원</Label>
                      <p className="font-medium">{selectedTable.guestCount}명</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">성비</Label>
                      <p className="font-medium">남 {selectedTable.maleCount} / 여 {selectedTable.femaleCount}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">지역</Label>
                      <p className="font-medium">{selectedTable.location || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">입장시간</Label>
                      <p className="font-medium">{formatTime(selectedTable.entryTime)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">이용 시간</span>
                    <span className="font-medium">{formatDuration(selectedTable.entryTime)}</span>
                  </div>

                  <Separator />

                  {/* 채팅 설정 */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>채팅 허용</Label>
                      <p className="text-xs text-muted-foreground">다른 테이블과 채팅 가능</p>
                    </div>
                    <Switch checked={selectedTable.chatEnabled} />
                  </div>

                  <Separator />

                  {/* 퇴장 버튼 */}
                  <Button
                    variant="destructive"
                    className="w-full gap-2"
                    onClick={handleExit}
                    disabled={deleteTable.isPending}
                  >
                    {deleteTable.isPending ? (
                      <IconLoader2 className="size-4 animate-spin" />
                    ) : (
                      <IconUserMinus className="size-4" />
                    )}
                    {deleteTable.isPending ? "처리 중..." : "퇴장 처리"}
                  </Button>
                </>
              )}

              {selectedTable.status === "empty" && (
                <div className="py-4 text-center text-muted-foreground">
                  현재 빈 테이블입니다.
                </div>
              )}

              {selectedTable.status === "reserved" && (
                <div className="py-4 text-center text-muted-foreground">
                  예약된 테이블입니다.
                </div>
              )}

              {selectedTable.status === "inactive" && (
                <div className="py-4 text-center text-muted-foreground">
                  비활성 테이블입니다.
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
