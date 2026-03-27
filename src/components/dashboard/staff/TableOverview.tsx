"use client"

import * as React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import {
  IconBan,
  IconCreditCard,
  IconMessageCircle,
  IconUsers,
  IconRefresh,
  IconAlertCircle,
  IconMapPin,
  IconClock,
  IconGenderMale,
  IconGenderFemale,
  IconDevices,
  IconUserPlus,
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
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useTables, useDeleteTable, tableKeys } from "@/hooks/use-tables"
import { fetchTables } from "@/lib/api/tables"
import { getApiErrorMessage } from "@/lib/api/error-utils"
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
import { useDevices, adminKeys } from "@/hooks/use-admin"
import { useQueryClient } from "@tanstack/react-query"
import type { Table } from "@/lib/api/tables"
import { toast } from "sonner"

// 디바이스 + 테이블 상태 결합 타입
interface DeviceTableInfo {
  deviceId: string
  deviceName: string
  isActive: boolean
  // 테이블 정보 (있으면)
  table: Table | null
  // 계산된 상태
  status: "active" | "empty" | "reserved" | "inactive"
}

const statusStyles = {
  active: "bg-green-500/20 border-green-500/50 text-green-700 dark:text-green-400",
  empty: "bg-muted border-muted-foreground/20 text-muted-foreground",
  reserved: "bg-amber-500/20 border-amber-500/50 text-amber-700 dark:text-amber-400",
  inactive: "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400",
} as const

const statusLabels = {
  active: "이용중",
  empty: "빈테이블",
  reserved: "예약",
  inactive: "비활성",
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

function formatDateTime(dateString?: string | null): string {
  if (!dateString) return "-"
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(dateString))
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
      key={item.id ?? item.orderItemId ?? item.giftId ?? getLineItemName(item)}
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

interface TableDetailDialogProps {
  deviceTable: DeviceTableInfo | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: (tableId: string) => void
  isDeleting: boolean
  onMuteToggle: (roomId: number, deviceId: string) => void
  onLiftSanction: (roomId: number) => void
  onOpenBilling: () => void
}

function TableDetailDialog({
  deviceTable,
  open,
  onOpenChange,
  onDelete,
  isDeleting,
  onMuteToggle,
  onLiftSanction,
  onOpenBilling,
}: TableDetailDialogProps) {
  const router = useRouter()
  if (!deviceTable) return null

  const { table } = deviceTable

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{deviceTable.deviceName}</span>
            <Badge
              variant="secondary"
              className={cn(
                "text-xs",
                deviceTable.status === "active" && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
                deviceTable.status === "inactive" && "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
              )}
            >
              {statusLabels[deviceTable.status]}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            디바이스 상세 정보
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 기본 정보 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <IconDevices className="h-3 w-3" />
                디바이스 ID
              </p>
              <p className="text-sm font-mono text-xs">{deviceTable.deviceId}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <IconMapPin className="h-3 w-3" />
                위치
              </p>
              <p className="text-sm">{table?.location || "-"}</p>
            </div>
          </div>

          {/* 디바이스 비활성 상태 안내 */}
          {!deviceTable.isActive && (
            <>
              <Separator />
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <IconAlertCircle className="h-4 w-4" />
                <span>이 디바이스는 비활성 상태입니다</span>
              </div>
            </>
          )}

          {/* 이용 정보 (active 상태일 때만) */}
          {deviceTable.status === "active" && table && (
            <>
              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <IconUsers className="h-3 w-3" />
                    총 인원
                  </p>
                  <p className="text-sm font-medium">{table.guestCount}명</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">성비</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="flex items-center gap-0.5 text-blue-600">
                      <IconGenderMale className="h-4 w-4" />
                      {table.maleCount}
                    </span>
                    <span className="text-muted-foreground">/</span>
                    <span className="flex items-center gap-0.5 text-pink-600">
                      <IconGenderFemale className="h-4 w-4" />
                      {table.femaleCount}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <IconClock className="h-3 w-3" />
                    입장 시간
                  </p>
                  <p className="text-sm">{formatTime(table.entryTime)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">이용 시간</p>
                  <p className="text-sm">{formatDuration(table.entryTime)}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <IconMessageCircle className="h-3 w-3" />
                  채팅 상태
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant={table.chatEnabled ? "default" : "secondary"}>
                    {table.chatEnabled ? "채팅중" : "채팅 없음"}
                  </Badge>
                  {table.chatSanctionType && (
                    <Badge variant="destructive" className="text-xs">
                      {table.chatSanctionType === "WARNING"
                        ? "경고"
                        : table.chatSanctionType === "MUTE"
                          ? "음소거"
                          : "채팅 금지"}
                    </Badge>
                  )}
                  {table.isChatMuted && !table.chatSanctionType && (
                    <Badge variant="secondary" className="text-xs">
                      <IconVolumeOff className="size-3 mr-1" />
                      음소거
                    </Badge>
                  )}
                </div>
                {table.chatSanctionExpiresAt && (
                  <p className="text-xs text-muted-foreground">
                    만료: {formatTime(table.chatSanctionExpiresAt)}
                  </p>
                )}
                {table.chatRoomId && (table.isChatMuted || table.chatSanctionType) && (
                  <div className="flex gap-2 mt-2">
                    {table.isChatMuted && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => onMuteToggle(table.chatRoomId!, deviceTable.deviceId)}
                      >
                        <IconVolumeOff className="size-3 mr-1" />
                        음소거 해제
                      </Button>
                    )}
                    {table.chatSanctionType && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs text-destructive"
                        onClick={() => onLiftSanction(table.chatRoomId!)}
                      >
                        <IconBan className="size-3 mr-1" />
                        제재 해제
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* 액션 버튼 */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              닫기
            </Button>
            {deviceTable.status === "empty" && (
              <Button
                onClick={() => {
                  onOpenChange(false)
                  router.push(`/staff/entry?deviceId=${deviceTable.deviceId}`)
                }}
              >
                <IconUserPlus className="mr-2 h-4 w-4" />
                입장 등록
              </Button>
            )}
            {deviceTable.status === "active" && (
              <>
                <Button onClick={onOpenBilling}>
                  <IconCreditCard className="mr-2 h-4 w-4" />
                  결제 보기
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => onDelete(deviceTable.table?.tableId || deviceTable.deviceId)}
                  disabled={isDeleting}
                >
                  {isDeleting ? "삭제 중..." : "테이블 삭제"}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface TableBillingDialogProps {
  deviceTable: DeviceTableInfo | null
  open: boolean
  onOpenChange: (open: boolean) => void
  isBilling: boolean
  onCloseBill: (identifier: string) => Promise<boolean>
}

function TableBillingDialog({
  deviceTable,
  open,
  onOpenChange,
  isBilling,
  onCloseBill,
}: TableBillingDialogProps) {
  const identifier = deviceTable?.deviceId
  const hasActiveTable = Boolean(deviceTable?.table)
  const {
    data: currentBill,
    isLoading: billLoading,
    isFetching: billFetching,
    refetch: refetchBill,
  } = useQuery({
    queryKey: ["staff", "overview", identifier, "bill"],
    queryFn: () => fetchCurrentTableBill(identifier!),
    enabled: open && hasActiveTable && !!identifier,
    staleTime: 0,
    refetchOnWindowFocus: false,
  })
  const {
    data: currentOrders,
    isLoading: ordersLoading,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ["staff", "overview", identifier, "orders"],
    queryFn: () => fetchTableOrders(identifier!),
    enabled: open && hasActiveTable && !!identifier,
    staleTime: 0,
    refetchOnWindowFocus: false,
  })
  const {
    data: billHistory = [],
    isLoading: billHistoryLoading,
    refetch: refetchBillHistory,
  } = useQuery({
    queryKey: ["staff", "overview", identifier, "bills"],
    queryFn: () => fetchTableBills(identifier!),
    enabled: open && hasActiveTable && !!identifier,
    staleTime: 0,
    refetchOnWindowFocus: false,
  })

  if (!deviceTable?.table || !identifier) return null

  const handleCloseCurrentBill = async () => {
    const isClosed = await onCloseBill(identifier)
    if (!isClosed) return

    await Promise.all([refetchBill(), refetchOrders(), refetchBillHistory()])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconCreditCard className="h-4 w-4" />
            <span>{deviceTable.deviceName} 결제</span>
          </DialogTitle>
          <DialogDescription>현재 bill과 결제 이력을 관리합니다.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">현재 결제</p>
              <p className="text-sm">bill, 주문, 선물 내역</p>
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
                  <p className="text-xs text-muted-foreground">Bill ID</p>
                  <p className="font-medium">{getBillId(currentBill) ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">상태</p>
                  <div className="mt-1">
                    <Badge variant={getBillStatus(currentBill) === "OPEN" ? "secondary" : "default"}>
                      {getBillStatus(currentBill)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">총액</p>
                  <p className="font-medium">{formatAmount(getBillTotalAmount(currentBill))}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">생성 시각</p>
                  <p className="font-medium">{formatDateTime(getBillCreatedAt(currentBill))}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">주문 내역</p>
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
                  <p className="text-xs text-muted-foreground">선물 내역</p>
                  {getGiftItems(currentOrders || currentBill).map((item, index) => (
                    <LineItemRow
                      key={item.id ?? item.giftId ?? `${getLineItemName(item)}-${index}`}
                      item={item}
                    />
                  ))}
                </div>
              )}

              <Button
                className="w-full"
                onClick={() => void handleCloseCurrentBill()}
                disabled={isBilling}
              >
                <IconCreditCard className="mr-2 h-4 w-4" />
                {isBilling ? "결제 처리 중..." : "결제 마감"}
              </Button>
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Bill 히스토리</p>
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
                        {formatDateTime(getBillCreatedAt(bill))}
                        {getBillClosedAt(bill) ? ` / ${formatDateTime(getBillClosedAt(bill))} 종료` : ""}
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
      </DialogContent>
    </Dialog>
  )
}

export function TableOverview() {
  const [selectedDeviceId, setSelectedDeviceId] = React.useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [billingOpen, setBillingOpen] = React.useState(false)
  const [isBilling, setIsBilling] = React.useState(false)

  const queryClient = useQueryClient()
  const { data: devices = [], isLoading: devicesLoading, isFetching: devicesFetching, isError: devicesError, error: devicesErrorData } = useDevices()
  const { data: tables = [] } = useTables() // WebSocket에서 실시간 업데이트
  const deleteTable = useDeleteTable()

  // 디바이스 목록 기준으로 테이블 상태 매핑
  const deviceTableList = React.useMemo<DeviceTableInfo[]>(() => {
    return devices.map((device) => {
      // deviceId로 매칭되는 테이블 찾기
      const table = tables.find((t) => t.tableId === device.deviceId) || null

      // 상태 결정: 비활성 > 예약 > 이용중 > 빈 테이블
      let status: "active" | "empty" | "reserved" | "inactive" = "empty"
      if (!device.isActive || table?.status === "inactive") {
        status = "inactive"
      } else if (table?.status === "reserved") {
        status = "reserved"
      } else if (table?.status === "active") {
        status = "active"
      }

      return {
        deviceId: device.deviceId,
        deviceName: device.deviceName || device.deviceId,
        isActive: device.isActive,
        table,
        status,
      }
    })
  }, [devices, tables])

  // 선택된 디바이스 정보 (캐시에서 실시간으로 가져옴)
  const selectedDeviceTable = React.useMemo(() => {
    if (!selectedDeviceId) return null
    return deviceTableList.find((dt) => dt.deviceId === selectedDeviceId) || null
  }, [selectedDeviceId, deviceTableList])

  const [isRefreshing, setIsRefreshing] = React.useState(false)

  const isLoading = devicesLoading
  const isFetching = devicesFetching || isRefreshing
  const isError = devicesError
  const error = devicesErrorData

  const handleDeviceTableClick = (deviceTable: DeviceTableInfo) => {
    setSelectedDeviceId(deviceTable.deviceId)
    setDialogOpen(true)
  }

  const handleOpenBilling = () => {
    setDialogOpen(false)
    setBillingOpen(true)
  }

  const handleMuteToggle = async (roomId: number, deviceId: string) => {
    try {
      await toggleMute(roomId, deviceId)
      // 테이블 캐시 갱신
      const tablesData = await fetchTables()
      queryClient.setQueryData(tableKeys.list(), tablesData)
      toast.success("음소거 상태가 변경되었습니다")
    } catch (err) {
      const message = err instanceof Error ? err.message : "음소거 처리에 실패했습니다"
      toast.error(message)
    }
  }

  const handleLiftSanction = async (roomId: number) => {
    try {
      await liftSanction(roomId)
      const tablesData = await fetchTables()
      queryClient.setQueryData(tableKeys.list(), tablesData)
      toast.success("제재가 해제되었습니다")
    } catch (err) {
      const message = err instanceof Error ? err.message : "제재 해제에 실패했습니다"
      toast.error(message)
    }
  }

  const handleDelete = async (tableId: string) => {
    try {
      await deleteTable.mutateAsync(tableId)
      toast.success("테이블이 삭제되었습니다")
      setDialogOpen(false)
    } catch (err) {
      const message = getApiErrorMessage(err, "삭제에 실패했습니다")
      toast.error(message)
    }
  }

  const handleCloseBill = async (identifier: string): Promise<boolean> => {
    try {
      setIsBilling(true)
      await closeTableBill(identifier)
      const tablesData = await fetchTables()
      queryClient.setQueryData(tableKeys.list(), tablesData)
      toast.success("결제가 마감되었습니다")
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : "결제 마감에 실패했습니다"
      toast.error(message)
      return false
    } finally {
      setIsBilling(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      // 디바이스 + 테이블 API 호출 후 캐시 직접 업데이트
      const [, tablesData] = await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminKeys.devices() }),
        fetchTables(),
      ])
      // 테이블 데이터를 캐시에 스냅샷처럼 설정
      queryClient.setQueryData(tableKeys.list(), tablesData)
    } catch {
      toast.error("새로고침에 실패했습니다")
    } finally {
      setIsRefreshing(false)
    }
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <IconAlertCircle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-lg font-medium text-destructive mb-2">
            데이터를 불러오는데 실패했습니다
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            {error?.message || "알 수 없는 오류가 발생했습니다"}
          </p>
          <Button
            onClick={handleRefresh}
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
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>테이블 현황</CardTitle>
            <CardDescription>
              디바이스별 테이블 상태를 확인하고 관리합니다
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isFetching}
          >
            <IconRefresh className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton />
          ) : deviceTableList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p>등록된 디바이스가 없습니다</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {deviceTableList.map((deviceTable, index) => (
                <div
                  key={deviceTable.deviceId || index}
                  onClick={() => handleDeviceTableClick(deviceTable)}
                  className={cn(
                    "relative flex flex-col items-center justify-center rounded-lg border-2 p-4 transition-all hover:scale-[1.02] hover:shadow-md cursor-pointer",
                    statusStyles[deviceTable.status]
                  )}
                >
                  {/* 디바이스/테이블 이름 */}
                  <span className="text-lg font-bold">{deviceTable.deviceName}</span>

                  {/* 상태 배지 */}
                  <Badge
                    variant="secondary"
                    className="mt-1 text-xs"
                  >
                    {statusLabels[deviceTable.status]}
                  </Badge>

                  {/* 이용중일 때 추가 정보 */}
                  {deviceTable.status === "active" && deviceTable.table && (
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <span className="flex items-center gap-0.5">
                        <IconUsers className="size-3" />
                        {deviceTable.table.guestCount}
                      </span>
                      {deviceTable.table.chatEnabled && (
                        <span className="flex items-center gap-0.5 text-green-600">
                          <IconMessageCircle className="size-3" />
                        </span>
                      )}
                      {deviceTable.table.chatSanctionType && (
                        <span className="flex items-center gap-0.5 text-red-500">
                          <IconBan className="size-3" />
                        </span>
                      )}
                      {deviceTable.table.isChatMuted && (
                        <span className="flex items-center gap-0.5 text-amber-500">
                          <IconVolumeOff className="size-3" />
                        </span>
                      )}
                    </div>
                  )}

                  {/* 위치 표시 */}
                  {deviceTable.table?.location && (
                    <span className="mt-1 text-xs text-muted-foreground">
                      {deviceTable.table.location}
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
              <div className="size-3 rounded-sm bg-red-500/10 border border-red-500/30" />
              <span>비활성</span>
            </div>
            <div className="flex items-center gap-1.5">
              <IconMessageCircle className="size-3 text-green-600" />
              <span>채팅중</span>
            </div>
            <div className="flex items-center gap-1.5">
              <IconBan className="size-3 text-red-500" />
              <span>제재</span>
            </div>
            <div className="flex items-center gap-1.5">
              <IconVolumeOff className="size-3 text-amber-500" />
              <span>음소거</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 상세보기 다이얼로그 */}
      <TableDetailDialog
        deviceTable={selectedDeviceTable}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onDelete={handleDelete}
        isDeleting={deleteTable.isPending}
        onMuteToggle={handleMuteToggle}
        onLiftSanction={handleLiftSanction}
        onOpenBilling={handleOpenBilling}
      />

      <TableBillingDialog
        deviceTable={selectedDeviceTable}
        open={billingOpen}
        onOpenChange={setBillingOpen}
        isBilling={isBilling}
        onCloseBill={handleCloseBill}
      />
    </>
  )
}
