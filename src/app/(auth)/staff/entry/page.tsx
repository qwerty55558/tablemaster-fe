"use client"
/* eslint-disable react-hooks/incompatible-library */

import { Suspense, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  IconCheck,
  IconClock,
  IconMinus,
  IconPlus,
  IconUsers,
  IconAlertCircle,
  IconLoader2,
  IconRefresh,
  IconArrowUp,
  IconArrowDown,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useAvailableDevices, useSetupTable, useTableHistory } from "@/hooks/use-tables"
import { toast } from "sonner"

// ================================
// Zod 스키마
// ================================

const entryFormSchema = z.object({
  deviceId: z.string().min(1, "테이블을 선택해주세요"),
  tableName: z.string().min(1, "테이블 이름을 입력해주세요").max(20, "20자 이하로 입력해주세요"),
  maleCount: z.number().int().min(0, "0 이상이어야 합니다"),
  femaleCount: z.number().int().min(0, "0 이상이어야 합니다"),
  location: z.string().min(1, "지역을 선택해주세요"),
}).refine((data) => data.maleCount + data.femaleCount > 0, {
  message: "최소 1명 이상이어야 합니다",
  path: ["maleCount"],
})

type EntryFormValues = z.infer<typeof entryFormSchema>

// ================================
// 상수
// ================================

const regions = [
  "서울", "부산", "대구", "인천", "광주",
  "대전", "울산", "세종", "경기", "강원",
  "충북", "충남", "전북", "전남", "경북",
  "경남", "제주", "해외",
]

function formatTime(dateString?: string | null): string {
  if (!dateString) return "-"
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date)
}

function formatDuration(start?: string | null, end?: string | null): string {
  if (!start) return "-"
  const startDate = new Date(start)
  const endDate = end ? new Date(end) : new Date()
  const diffMs = endDate.getTime() - startDate.getTime()
  if (diffMs < 0) return "-"
  const totalMin = Math.floor(diffMs / 60000)
  const hours = Math.floor(totalMin / 60)
  const minutes = totalMin % 60
  if (hours > 0) return `${hours}시간 ${minutes}분`
  return `${minutes}분`
}

type SortOrder = "desc" | "asc"

// ================================
// 페이지
// ================================

export default function EntryPage() {
  return (
    <Suspense>
      <EntryPageContent />
    </Suspense>
  )
}

function EntryPageContent() {
  const searchParams = useSearchParams()
  const preselectedDeviceId = searchParams.get("deviceId")

  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [offset, setOffset] = useState(0)
  const limit = 20

  const { data: availableDevices = [], isLoading: devicesLoading } = useAvailableDevices()
  const {
    data: historyData,
    isLoading: historyLoading,
    isFetching: historyFetching,
    dataUpdatedAt,
    refetch: refetchHistory,
  } = useTableHistory({ offset, limit })
  const setupTable = useSetupTable()

  const form = useForm<EntryFormValues>({
    resolver: zodResolver(entryFormSchema),
    defaultValues: {
      deviceId: preselectedDeviceId || "",
      tableName: "",
      maleCount: 0,
      femaleCount: 0,
      location: "",
    },
  })

  const { watch, setValue, handleSubmit, formState: { errors }, reset } = form

  // URL query param으로 deviceId가 넘어온 경우 폼에 세팅
  useEffect(() => {
    if (preselectedDeviceId) {
      setValue("deviceId", preselectedDeviceId, { shouldValidate: true })
    }
  }, [preselectedDeviceId, setValue])
  const deviceId = watch("deviceId")
  const maleCount = watch("maleCount")
  const femaleCount = watch("femaleCount")
  const totalGuests = maleCount + femaleCount

  const historyEntries = useMemo(() => {
    const entries = historyData?.content ?? []
    if (sortOrder === "asc") return [...entries].reverse()
    return entries
  }, [historyData?.content, sortOrder])

  const onSubmit = async (values: EntryFormValues) => {
    try {
      await setupTable.mutateAsync({
        deviceId: values.deviceId,
        tableName: values.tableName,
        location: values.location,
        guestCount: values.maleCount + values.femaleCount,
        maleCount: values.maleCount,
        femaleCount: values.femaleCount,
      })
      toast.success(`${values.tableName}에 ${values.maleCount + values.femaleCount}명 입장 등록 완료`)
      reset()
    } catch (err) {
      const message = err instanceof Error ? err.message : "입장 등록에 실패했습니다"
      toast.error(message)
    }
  }

  const handleDeviceSelect = (id: string) => {
    setValue("deviceId", id, { shouldValidate: true })
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* 입장 등록 폼 */}
          <Card>
            <CardHeader>
              <CardTitle>입장 등록</CardTitle>
              <CardDescription>새로운 손님 입장 정보를 입력하세요</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* 테이블 선택 */}
                <div className="space-y-2">
                  <Label>테이블 선택</Label>
                  {devicesLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select value={deviceId} onValueChange={handleDeviceSelect}>
                      <SelectTrigger className={errors.deviceId ? "border-destructive" : ""}>
                        <SelectValue placeholder="빈 테이블을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDevices.length === 0 ? (
                          <div className="py-4 text-center text-sm text-muted-foreground">
                            빈 테이블이 없습니다
                          </div>
                        ) : (
                          availableDevices.map((device) => (
                            <SelectItem key={device.deviceId} value={device.deviceId}>
                              {device.deviceName || device.deviceId}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                  {errors.deviceId && (
                    <p className="text-xs text-destructive">{errors.deviceId.message}</p>
                  )}
                </div>

                {/* 테이블 이름 */}
                <div className="space-y-2">
                  <Label>테이블 이름</Label>
                  <Input
                    placeholder="예: A1, 1번 테이블"
                    {...form.register("tableName")}
                    className={errors.tableName ? "border-destructive" : ""}
                  />
                  {errors.tableName && (
                    <p className="text-xs text-destructive">{errors.tableName.message}</p>
                  )}
                </div>

                {/* 인원 입력 */}
                <div className="space-y-4">
                  <Label>인원 수</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">남성</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setValue("maleCount", Math.max(0, maleCount - 1), { shouldValidate: true })}
                          disabled={maleCount === 0}
                        >
                          <IconMinus className="size-4" />
                        </Button>
                        <Input
                          type="number"
                          value={maleCount}
                          onChange={(e) => setValue("maleCount", Math.max(0, parseInt(e.target.value) || 0), { shouldValidate: true })}
                          className="text-center"
                          min={0}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setValue("maleCount", maleCount + 1, { shouldValidate: true })}
                        >
                          <IconPlus className="size-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">여성</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setValue("femaleCount", Math.max(0, femaleCount - 1), { shouldValidate: true })}
                          disabled={femaleCount === 0}
                        >
                          <IconMinus className="size-4" />
                        </Button>
                        <Input
                          type="number"
                          value={femaleCount}
                          onChange={(e) => setValue("femaleCount", Math.max(0, parseInt(e.target.value) || 0), { shouldValidate: true })}
                          className="text-center"
                          min={0}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setValue("femaleCount", femaleCount + 1, { shouldValidate: true })}
                        >
                          <IconPlus className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  {totalGuests > 0 && (
                    <p className="text-sm text-muted-foreground">
                      총 {totalGuests}명 (남 {maleCount}, 여 {femaleCount})
                    </p>
                  )}
                  {errors.maleCount && (
                    <p className="text-xs text-destructive">{errors.maleCount.message}</p>
                  )}
                </div>

                {/* 지역 선택 */}
                <div className="space-y-2">
                  <Label>지역</Label>
                  <Select
                    value={watch("location")}
                    onValueChange={(v) => setValue("location", v, { shouldValidate: true })}
                  >
                    <SelectTrigger className={errors.location ? "border-destructive" : ""}>
                      <SelectValue placeholder="지역을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.location && (
                    <p className="text-xs text-destructive">{errors.location.message}</p>
                  )}
                </div>

                {/* 등록 버튼 */}
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={setupTable.isPending}
                >
                  {setupTable.isPending ? (
                    <IconLoader2 className="size-4 mr-2 animate-spin" />
                  ) : (
                    <IconCheck className="size-4 mr-2" />
                  )}
                  {setupTable.isPending ? "등록 중..." : "입장 등록"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* 빈 테이블 현황 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">빈 테이블 현황</CardTitle>
              <CardDescription>
                {devicesLoading ? "로딩 중..." : `${availableDevices.length}개 테이블 이용 가능`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {devicesLoading ? (
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-lg" />
                  ))}
                </div>
              ) : availableDevices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <IconAlertCircle className="size-8 mb-2" />
                  <p className="text-sm">현재 빈 테이블이 없습니다</p>
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-2">
                  {availableDevices.map((device) => (
                    <button
                      type="button"
                      key={device.deviceId}
                      onClick={() => handleDeviceSelect(device.deviceId)}
                      className={cn(
                        "flex flex-col items-center justify-center rounded-lg border-2 p-3 transition-colors hover:bg-accent",
                        deviceId === device.deviceId
                          ? "border-primary bg-primary/10"
                          : "border-muted",
                      )}
                    >
                      <span className="text-lg font-bold">{device.deviceName || device.deviceId}</span>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 최근 입장 기록 */}
        <Card className="mt-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">최근 입장 기록</CardTitle>
                <CardDescription>
                  {dataUpdatedAt
                    ? `${formatDateTime(new Date(dataUpdatedAt))} 기준`
                    : "데이터 로딩 중..."}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))}
                >
                  {sortOrder === "desc" ? (
                    <IconArrowDown className="size-4 mr-1" />
                  ) : (
                    <IconArrowUp className="size-4 mr-1" />
                  )}
                  {sortOrder === "desc" ? "최근순" : "오래된순"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchHistory()}
                  disabled={historyFetching}
                >
                  <IconRefresh className={cn("size-4 mr-1", historyFetching && "animate-spin")} />
                  새로고침
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : historyEntries.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                입장 기록이 없습니다
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>디바이스명</TableHead>
                    <TableHead>테이블명</TableHead>
                    <TableHead>인원</TableHead>
                    <TableHead>성비</TableHead>
                    <TableHead>지역</TableHead>
                    <TableHead>입장시간</TableHead>
                    <TableHead>사용시간</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyEntries.map((entry, index) => (
                    <TableRow
                      key={
                        entry.id ??
                        `${entry.deviceId}-${entry.createdAt}-${entry.name}-${index}`
                      }
                    >
                      <TableCell className="font-medium">{entry.deviceName}</TableCell>
                      <TableCell>{entry.name}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          <IconUsers className="size-4" />
                          {entry.guestCount}명
                        </span>
                      </TableCell>
                      <TableCell>남 {entry.maleCount} / 여 {entry.femaleCount}</TableCell>
                      <TableCell>{entry.location || "-"}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          <IconClock className="size-3.5" />
                          {formatTime(entry.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {formatDuration(entry.createdAt, entry.deletedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {historyData && historyData.totalCount > limit && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  {historyData.totalCount}건 중 {offset + 1}-{Math.min(offset + limit, historyData.totalCount)}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOffset((o) => Math.max(0, o - limit))}
                    disabled={offset === 0}
                  >
                    이전
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {Math.floor(offset / limit) + 1} / {Math.ceil(historyData.totalCount / limit)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOffset((o) => o + limit)}
                    disabled={!historyData.hasNext}
                  >
                    다음
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
