"use client"

import Image from "next/image"
import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  IconBan,
  IconCreditCard,
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
  IconVolumeOff,
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
import { getApiErrorMessage } from "@/lib/api/error-utils"
import type { Table as TableType } from "@/lib/api/tables"
import { toggleMute, liftSanction } from "@/lib/api/chat"
import {
  closeTableBill,
  fetchCurrentTableBill,
  fetchTableBills,
  fetchTableOrders,
  resolveCommerceImageUrl,
  type BillLineItem,
  type BillResponse,
} from "@/lib/api/commerce"
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

function formatDateTime(dateString?: string): string {
  if (!dateString) return "-"
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
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

function formatAmount(value?: number | null): string {
  if (typeof value !== "number") return "-"
  return `${value.toLocaleString("ko-KR")}원`
}

function getBillId(bill?: BillResponse | null): number | null {
  if (!bill) return null
  return bill.billId ?? bill.id ?? null
}

function getBillStatus(bill?: BillResponse | null): string {
  return bill?.status ?? "UNKNOWN"
}

function getBillTotalAmount(bill?: BillResponse | null): number | null {
  if (!bill) return null
  return bill.totalAmount ?? bill.amount ?? null
}

function getBillCreatedAt(bill?: BillResponse | null): string | null {
  return bill?.createdAt ?? bill?.openedAt ?? null
}

function getBillClosedAt(bill?: BillResponse | null): string | null {
  return bill?.closedAt ?? bill?.paidAt ?? null
}

function getOrderItems(bill?: BillResponse | null): BillLineItem[] {
  if (!bill) return []
  return bill.orderItems || bill.orders || []
}

function getGiftItems(bill?: BillResponse | null): BillLineItem[] {
  if (!bill) return []
  return bill.giftOrders || bill.giftItems || bill.gifts || []
}

function getLineItemName(item: BillLineItem): string {
  return item.itemName || item.menuName || item.giftName || item.name || "-"
}

function getLineItemQuantity(item: BillLineItem): number | string {
  return item.quantity ?? item.count ?? "-"
}

function getLineItemAmount(item: BillLineItem): number | null {
  return item.totalPrice ?? item.amount ?? item.price ?? item.unitPrice ?? null
}

function LineItemRow({ item }: { item: BillLineItem }) {
  const imageUrl = resolveCommerceImageUrl(item.imageUrl)

  return (
    <div
      className="flex items-center justify-between rounded-lg border p-3 text-sm"
    >
      <div className="flex items-center gap-3">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={getLineItemName(item)}
            width={48}
            height={48}
            className="h-12 w-12 rounded-md border object-cover"
            unoptimized
          />
        ) : (
          <div className="h-12 w-12 rounded-md border bg-muted" />
        )}
        <div>
          <p className="font-medium">{getLineItemName(item)}</p>
          <p className="text-xs text-muted-foreground">수량 {getLineItemQuantity(item)}</p>
        </div>
      </div>
      <span className="font-medium">{formatAmount(getLineItemAmount(item))}</span>
    </div>
  )
}

export default function TablesPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [billingOpen, setBillingOpen] = useState(false)

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

  const {
    data: currentBill,
    isLoading: billLoading,
    isFetching: billFetching,
    refetch: refetchBill,
  } = useQuery({
    queryKey: ["staff", "table", selectedTableId, "bill"],
    queryFn: () => fetchCurrentTableBill(selectedTableId!),
    enabled: billingOpen && !!selectedTableId,
    staleTime: 0,
    refetchOnWindowFocus: false,
  })

  const {
    data: currentOrders,
    isLoading: ordersLoading,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ["staff", "table", selectedTableId, "orders"],
    queryFn: () => fetchTableOrders(selectedTableId!),
    enabled: billingOpen && !!selectedTableId,
    staleTime: 0,
    refetchOnWindowFocus: false,
  })

  const {
    data: billHistory = [],
    isLoading: billHistoryLoading,
    refetch: refetchBillHistory,
  } = useQuery({
    queryKey: ["staff", "table", selectedTableId, "bills"],
    queryFn: () => fetchTableBills(selectedTableId!),
    enabled: billingOpen && !!selectedTableId,
    staleTime: 0,
    refetchOnWindowFocus: false,
  })

  const handleOpenDetail = (table: TableType) => {
    setSelectedTableId(table.tableId)
    setBillingOpen(false)
    setDetailOpen(true)
  }

  const handleOpenBilling = (table: TableType) => {
    setSelectedTableId(table.tableId)
    setDetailOpen(false)
    setBillingOpen(true)
  }

  const handleMuteToggle = async (roomId: number, deviceId: string) => {
    try {
      await toggleMute(roomId, deviceId)
      refetch()
      toast.success("음소거 상태가 변경되었습니다")
    } catch (err) {
      const message = err instanceof Error ? err.message : "음소거 처리에 실패했습니다"
      toast.error(message)
    }
  }

  const handleLiftSanction = async (roomId: number) => {
    try {
      await liftSanction(roomId)
      refetch()
      toast.success("제재가 해제되었습니다")
    } catch (err) {
      const message = err instanceof Error ? err.message : "제재 해제에 실패했습니다"
      toast.error(message)
    }
  }

  const handleExit = async () => {
    if (!selectedTable) return
    try {
      await deleteTable.mutateAsync(selectedTable.tableId)
      toast.success(`${selectedTable.tableName} 테이블 퇴장 처리되었습니다`)
      setDetailOpen(false)
    } catch (err) {
      const message = getApiErrorMessage(err, "퇴장 처리에 실패했습니다")
      toast.error(message)
    }
  }

  const handleCloseBill = async (): Promise<boolean> => {
    if (!selectedTableId) return false

    try {
      await closeTableBill(selectedTableId)
      await Promise.all([refetchBill(), refetchOrders(), refetchBillHistory(), refetch()])
      toast.success("결제가 마감되었습니다")
      setBillingOpen(false)
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : "결제 마감에 실패했습니다"
      toast.error(message)
      return false
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
                          <div className="flex items-center gap-1.5">
                            {table.chatEnabled ? (
                              <IconMessageCircle className="size-4 text-green-600" />
                            ) : (
                              <IconMessageOff className="size-4 text-muted-foreground" />
                            )}
                            {table.chatSanctionType && (
                              <Badge variant="destructive" className="text-[10px] h-4 px-1">
                                {table.chatSanctionType === "WARNING"
                                  ? "경고"
                                  : table.chatSanctionType === "MUTE"
                                    ? "음소거"
                                    : "금지"}
                              </Badge>
                            )}
                            {table.isChatMuted && !table.chatSanctionType && (
                              <IconVolumeOff className="size-4 text-amber-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDetail(table)}
                            >
                              상세
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleOpenBilling(table)}
                            >
                              결제
                            </Button>
                          </div>
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
            <DialogTitle>{selectedTable?.tableName || selectedTable?.deviceName} 상세</DialogTitle>
            <DialogDescription>
              테이블 목록 API 기준 상세 정보
            </DialogDescription>
          </DialogHeader>

          {selectedTable && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">상태</span>
                <Badge className={cn("font-normal", statusStyles[selectedTable.status])}>
                  {statusLabels[selectedTable.status]}
                </Badge>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">테이블명</Label>
                  <p className="font-medium">{selectedTable.tableName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">디바이스명</Label>
                  <p className="font-medium">{selectedTable.deviceName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">지역</Label>
                  <p className="font-medium">{selectedTable.location || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">채팅방 ID</Label>
                  <p className="font-medium">{selectedTable.chatRoomId ?? "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">입장 시각</Label>
                  <p className="font-medium">{formatDateTime(selectedTable.entryTime)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">최종 갱신</Label>
                  <p className="font-medium">{formatDateTime(selectedTable.updatedAt)}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">총 인원</Label>
                  <p className="font-medium">
                    {selectedTable.guestCount > 0 ? `${selectedTable.guestCount}명` : "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">성비</Label>
                  <p className="font-medium">
                    {selectedTable.guestCount > 0
                      ? `남 ${selectedTable.maleCount} / 여 ${selectedTable.femaleCount}`
                      : "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">이용 시간</Label>
                  <p className="font-medium">
                    {selectedTable.entryTime ? formatDuration(selectedTable.entryTime) : "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">채팅 상태</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant={selectedTable.chatEnabled ? "default" : "secondary"}>
                      {selectedTable.chatEnabled ? "채팅중" : "채팅 없음"}
                    </Badge>
                    {selectedTable.isChatMuted && !selectedTable.chatSanctionType && (
                      <Badge variant="secondary" className="text-xs">
                        <IconVolumeOff className="size-3 mr-1" />
                        음소거
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {(selectedTable.chatSanctionType || selectedTable.isChatMuted) && (
                <>
                  <Separator />

                  <div className="space-y-3">
                    {selectedTable.chatSanctionType && (
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <Label className="text-muted-foreground">채팅 제재</Label>
                          <div className="mt-1 flex items-center gap-2">
                            <Badge variant="destructive" className="text-xs">
                              <IconBan className="size-3 mr-1" />
                              {selectedTable.chatSanctionType === "WARNING"
                                ? "경고"
                                : selectedTable.chatSanctionType === "MUTE"
                                  ? "음소거"
                                  : "채팅 금지"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {selectedTable.chatSanctionExpiresAt
                                ? `${formatDateTime(selectedTable.chatSanctionExpiresAt)} 만료`
                                : "영구"}
                            </span>
                          </div>
                        </div>
                        {selectedTable.chatRoomId && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs text-destructive"
                            onClick={() => handleLiftSanction(selectedTable.chatRoomId!)}
                          >
                            해제
                          </Button>
                        )}
                      </div>
                    )}

                    {selectedTable.isChatMuted && (
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <Label className="text-muted-foreground">개별 음소거</Label>
                          <div className="mt-1">
                            <Badge variant="secondary" className="text-xs">
                              <IconVolumeOff className="size-3 mr-1" />
                              음소거됨
                            </Badge>
                          </div>
                        </div>
                        {selectedTable.chatRoomId && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            onClick={() => handleMuteToggle(selectedTable.chatRoomId!, selectedTable.tableId)}
                          >
                            해제
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
              <Separator />

              <Button
                variant="destructive"
                className="w-full gap-2"
                onClick={handleExit}
                disabled={deleteTable.isPending || selectedTable.status !== "active"}
              >
                {deleteTable.isPending ? (
                  <IconLoader2 className="size-4 animate-spin" />
                ) : (
                  <IconUserMinus className="size-4" />
                )}
                {deleteTable.isPending ? "처리 중..." : "퇴장 처리"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={billingOpen} onOpenChange={setBillingOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconCreditCard className="size-4" />
              {selectedTable?.tableName || selectedTable?.deviceName} 결제
            </DialogTitle>
            <DialogDescription>현재 bill과 결제 이력을 관리합니다.</DialogDescription>
          </DialogHeader>

          {selectedTable && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-muted-foreground">현재 결제</Label>
                  <p className="text-xs text-muted-foreground">bill, 주문, 선물 내역</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void Promise.all([refetchBill(), refetchOrders(), refetchBillHistory()])
                  }}
                  disabled={billFetching}
                >
                  <IconRefresh className={cn("size-4", billFetching && "animate-spin")} />
                </Button>
              </div>

              {billLoading || ordersLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : !currentBill ? (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  현재 open bill이 없습니다.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">Bill ID</Label>
                      <p className="font-medium">{getBillId(currentBill) ?? "-"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">상태</Label>
                      <div className="mt-1">
                        <Badge variant={getBillStatus(currentBill) === "OPEN" ? "secondary" : "default"}>
                          {getBillStatus(currentBill)}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">총액</Label>
                      <p className="font-medium">{formatAmount(getBillTotalAmount(currentBill))}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">생성 시각</Label>
                      <p className="font-medium">{formatDateTime(getBillCreatedAt(currentBill) || undefined)}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground">주문 내역</Label>
                    {getOrderItems(currentOrders || currentBill).length === 0 ? (
                      <p className="text-sm text-muted-foreground">주문 내역이 없습니다.</p>
                    ) : (
                      getOrderItems(currentOrders || currentBill).map((item, index) => (
                        <LineItemRow
                          key={item.id ?? item.orderItemId ?? `${getLineItemName(item)}-${index}`}
                          item={item}
                        />
                      ))
                    )}
                  </div>

                  {getGiftItems(currentOrders || currentBill).length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">선물 내역</Label>
                      {getGiftItems(currentOrders || currentBill).map((item, index) => (
                        <LineItemRow
                          key={item.id ?? item.giftId ?? `${getLineItemName(item)}-${index}`}
                          item={item}
                        />
                      ))}
                    </div>
                  )}

                  <Button className="w-full gap-2" onClick={handleCloseBill}>
                    <IconCreditCard className="size-4" />
                    결제 마감
                  </Button>
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <Label className="text-muted-foreground">Bill 히스토리</Label>
                {billHistoryLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : billHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">히스토리 데이터가 없습니다.</p>
                ) : (
                  <div className="space-y-2">
                    {billHistory.slice(0, 5).map((bill) => (
                      <div
                        key={getBillId(bill) ?? `${getBillCreatedAt(bill)}-${getBillTotalAmount(bill)}`}
                        className="flex items-center justify-between rounded-lg border p-3 text-sm"
                      >
                        <div>
                          <p className="font-medium">#{getBillId(bill) ?? "-"}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(getBillCreatedAt(bill) || undefined)}
                            {getBillClosedAt(bill) ? ` / ${formatDateTime(getBillClosedAt(bill) || undefined)} 종료` : ""}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">{getBillStatus(bill)}</Badge>
                          <p className="mt-1 font-medium">{formatAmount(getBillTotalAmount(bill))}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
