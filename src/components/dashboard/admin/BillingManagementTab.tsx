"use client"

import * as React from "react"
import Image from "next/image"
import { useQuery } from "@tanstack/react-query"
import {
  IconAlertCircle,
  IconCreditCard,
  IconLoader2,
  IconRefresh,
} from "@tabler/icons-react"

import {
  fetchAdminBillDetail,
  fetchAdminBills,
  fetchTableBills,
  resolveCommerceImageUrl,
  type BillLineItem,
  type BillResponse,
  type BillStatus,
} from "@/lib/api/commerce"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

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

function getBillId(bill: BillResponse): number | null {
  return bill.billId ?? bill.id ?? null
}

function getBillStatus(bill: BillResponse): string {
  return bill.status ?? "UNKNOWN"
}

function getBillTotalAmount(bill: BillResponse): number | null {
  return bill.totalAmount ?? bill.amount ?? null
}

function getBillCreatedAt(bill: BillResponse): string | null {
  return bill.createdAt ?? bill.openedAt ?? null
}

function getBillClosedAt(bill: BillResponse): string | null {
  return bill.closedAt ?? bill.paidAt ?? null
}

function getBillIdentifier(bill: BillResponse): string | null {
  return bill.deviceId ?? bill.tableId ?? bill.tableName ?? null
}

function getBillTableLabel(bill: BillResponse): string {
  return bill.tableName || bill.deviceName || bill.tableId || bill.deviceId || "-"
}

function getOrderItems(bill: BillResponse): BillLineItem[] {
  return bill.orderItems || bill.orders || []
}

function getGiftItems(bill: BillResponse): BillLineItem[] {
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
    <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
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
          <p className="text-xs text-muted-foreground">
            수량 {getLineItemQuantity(item)}
          </p>
        </div>
      </div>
      <span className="font-medium">{formatAmount(getLineItemAmount(item))}</span>
    </div>
  )
}

function BillStatusBadge({ status }: { status: string }) {
  if (status === "OPEN") return <Badge variant="secondary">OPEN</Badge>
  if (status === "CLOSED") return <Badge> CLOSED </Badge>
  if (status === "CANCELLED") return <Badge variant="destructive">CANCELLED</Badge>
  return <Badge variant="outline">{status}</Badge>
}

function BillRowsSkeleton() {
  return Array.from({ length: 5 }).map((_, index) => (
    <TableRow key={index}>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-5 w-18" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell className="text-right"><Skeleton className="ml-auto h-8 w-14" /></TableCell>
    </TableRow>
  ))
}

export function BillingManagementTab() {
  const [statusFilter, setStatusFilter] = React.useState<BillStatus | "all">("all")
  const [selectedBillId, setSelectedBillId] = React.useState<number | null>(null)
  const [detailOpen, setDetailOpen] = React.useState(false)

  const {
    data: bills = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin", "bills", statusFilter],
    queryFn: () => fetchAdminBills(statusFilter),
    staleTime: 0,
    refetchOnWindowFocus: false,
  })

  const {
    data: billDetail,
    isLoading: detailLoading,
    isFetching: detailFetching,
    error: detailError,
  } = useQuery({
    queryKey: ["admin", "bill-detail", selectedBillId],
    queryFn: () => fetchAdminBillDetail(selectedBillId!),
    enabled: detailOpen && selectedBillId !== null,
    staleTime: 0,
    refetchOnWindowFocus: false,
  })

  const tableIdentifier = billDetail ? getBillIdentifier(billDetail) : null

  const {
    data: tableBills = [],
    isLoading: tableBillsLoading,
    error: tableBillsError,
  } = useQuery({
    queryKey: ["admin", "table-bills", tableIdentifier],
    queryFn: () => fetchTableBills(tableIdentifier!),
    enabled: detailOpen && !!tableIdentifier,
    staleTime: 0,
    refetchOnWindowFocus: false,
  })

  const openDetail = (billId: number | null) => {
    if (billId === null) return
    setSelectedBillId(billId)
    setDetailOpen(true)
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <IconAlertCircle className="mb-4 h-12 w-12 text-destructive" />
          <p className="mb-2 text-lg font-medium text-destructive">
            결제 내역을 불러오는데 실패했습니다
          </p>
          <p className="mb-4 text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다"}
          </p>
          <Button onClick={() => refetch()} variant="outline">
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
            <CardTitle>결제 내역</CardTitle>
            <CardDescription>
              전체 bill 목록과 상세, 테이블별 bill 히스토리를 조회합니다.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as BillStatus | "all")}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="상태 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                <SelectItem value="OPEN">OPEN</SelectItem>
                <SelectItem value="CLOSED">CLOSED</SelectItem>
                <SelectItem value="CANCELLED">CANCELLED</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
              <IconRefresh className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill ID</TableHead>
                <TableHead>테이블</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>총액</TableHead>
                <TableHead>생성 시각</TableHead>
                <TableHead className="text-right">상세</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <BillRowsSkeleton />
              ) : bills.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    조회된 결제 내역이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                bills.map((bill) => {
                  const billId = getBillId(bill)
                  return (
                    <TableRow key={billId ?? `${getBillTableLabel(bill)}-${getBillCreatedAt(bill)}`}>
                      <TableCell className="font-medium">
                        {billId !== null ? `#${billId}` : "-"}
                      </TableCell>
                      <TableCell>{getBillTableLabel(bill)}</TableCell>
                      <TableCell>
                        <BillStatusBadge status={getBillStatus(bill)} />
                      </TableCell>
                      <TableCell>{formatAmount(getBillTotalAmount(bill))}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(getBillCreatedAt(bill))}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={billId === null}
                          onClick={() => openDetail(billId)}
                        >
                          상세
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open)
          if (!open) setSelectedBillId(null)
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconCreditCard className="h-5 w-5" />
              Bill 상세
            </DialogTitle>
            <DialogDescription>
              선택한 bill 상세와 같은 테이블의 bill 히스토리를 표시합니다.
            </DialogDescription>
          </DialogHeader>

          {detailLoading || detailFetching ? (
            <div className="flex items-center justify-center py-12">
              <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : detailError ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
              {detailError instanceof Error ? detailError.message : "상세 조회에 실패했습니다."}
            </div>
          ) : billDetail ? (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Bill ID</p>
                  <p className="mt-1 font-medium">{getBillId(billDetail) ?? "-"}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">테이블</p>
                  <p className="mt-1 font-medium">{getBillTableLabel(billDetail)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">상태</p>
                  <div className="mt-1">
                    <BillStatusBadge status={getBillStatus(billDetail)} />
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">총액</p>
                  <p className="mt-1 font-medium">{formatAmount(getBillTotalAmount(billDetail))}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">생성 시각</p>
                  <p className="mt-1 font-medium">{formatDateTime(getBillCreatedAt(billDetail))}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">종료 시각</p>
                  <p className="mt-1 font-medium">{formatDateTime(getBillClosedAt(billDetail))}</p>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">주문 내역</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {getOrderItems(billDetail).length === 0 ? (
                      <p className="text-sm text-muted-foreground">주문 내역이 없습니다.</p>
                    ) : (
                      getOrderItems(billDetail).map((item, index) => (
                        <LineItemRow
                          key={item.id ?? item.orderItemId ?? `${getLineItemName(item)}-${index}`}
                          item={item}
                        />
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">선물 내역</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {getGiftItems(billDetail).length === 0 ? (
                      <p className="text-sm text-muted-foreground">선물 내역이 없습니다.</p>
                    ) : (
                      getGiftItems(billDetail).map((item, index) => (
                        <LineItemRow
                          key={item.id ?? item.giftId ?? `${getLineItemName(item)}-${index}`}
                          item={item}
                        />
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>

              <Separator />

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">같은 테이블 Bill 히스토리</CardTitle>
                  <CardDescription>
                    {tableIdentifier
                      ? `${tableIdentifier} 기준 조회`
                      : "테이블 식별자가 없어 히스토리를 조회할 수 없습니다."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!tableIdentifier ? (
                    <p className="text-sm text-muted-foreground">히스토리 조회 불가</p>
                  ) : tableBillsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <IconLoader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : tableBillsError ? (
                    <div className="text-sm text-destructive">
                      {tableBillsError instanceof Error
                        ? tableBillsError.message
                        : "테이블 bill 히스토리 조회에 실패했습니다."}
                    </div>
                  ) : tableBills.length === 0 ? (
                    <p className="text-sm text-muted-foreground">히스토리 데이터가 없습니다.</p>
                  ) : (
                    <div className="space-y-2">
                      {tableBills.map((bill) => (
                        <div
                          key={getBillId(bill) ?? `${getBillTableLabel(bill)}-${getBillCreatedAt(bill)}`}
                          className="flex items-center justify-between rounded-lg border p-3 text-sm"
                        >
                          <div>
                            <p className="font-medium">#{getBillId(bill) ?? "-"}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDateTime(getBillCreatedAt(bill))}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <BillStatusBadge status={getBillStatus(bill)} />
                            <span className="font-medium">{formatAmount(getBillTotalAmount(bill))}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <details className="rounded-lg border p-3 text-sm">
                <summary className="cursor-pointer font-medium">원본 응답 보기</summary>
                <pre className="mt-3 overflow-auto whitespace-pre-wrap break-all text-xs leading-5 text-muted-foreground">
                  {JSON.stringify(billDetail, null, 2)}
                </pre>
              </details>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
