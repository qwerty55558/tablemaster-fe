"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  IconDeviceTablet,
  IconCheck,
  IconRefresh,
  IconInbox,
  IconLoader2,
  IconClock,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useQueryClient } from "@tanstack/react-query"
import { usePendingDevices, useApproveDevice, adminKeys } from "@/hooks/use-admin"
import { toast } from "sonner"
import { motionConfig } from "@/components/motion"
import type { PendingDevice } from "@/lib/api/admin"

interface PendingDeviceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface DeviceItemProps {
  device: PendingDevice
  index: number
  onApprove: (deviceId: string, deviceName?: string) => void
  isPending: boolean
}

function formatTTL(seconds: number): string {
  if (seconds <= 0) return "만료됨"
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins > 0) {
    return `${mins}분 ${secs}초`
  }
  return `${secs}초`
}

function DeviceItem({ device, index, onApprove, isPending }: DeviceItemProps) {
  const [deviceName, setDeviceName] = React.useState("")
  const [remainingTTL, setRemainingTTL] = React.useState(device.ttl)

  // 서버에서 새로 받아온 ttl로 동기화
  React.useEffect(() => {
    setRemainingTTL(device.ttl)
  }, [device.ttl])

  // 1초마다 카운트다운
  React.useEffect(() => {
    if (remainingTTL <= 0) return

    const timer = setInterval(() => {
      setRemainingTTL((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [remainingTTL])

  const handleApprove = () => {
    if (!deviceName.trim()) {
      toast.error("테이블 이름을 입력해주세요")
      return
    }
    onApprove(device.deviceId, deviceName.trim())
  }

  const isExpiringSoon = remainingTTL <= 30
  const isExpired = remainingTTL <= 0

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: isExpired ? 0.5 : 1, y: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{
        duration: motionConfig.duration.normal,
        delay: index * motionConfig.stagger.fast,
        ease: motionConfig.ease.default,
      }}
      className="flex items-center gap-3 rounded-lg border bg-card p-3"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
        <IconDeviceTablet className="h-5 w-5 text-amber-600 dark:text-amber-400" />
      </div>
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2">
          <code className="text-xs text-muted-foreground truncate">
            {device.deviceId}
          </code>
          <span
            className={`flex items-center gap-1 text-xs ${
              isExpired
                ? "text-destructive"
                : isExpiringSoon
                ? "text-amber-500"
                : "text-muted-foreground"
            }`}
          >
            <IconClock className="h-3 w-3" />
            {formatTTL(remainingTTL)}
          </span>
        </div>
        <Input
          placeholder="테이블 이름 (예: 1번 테이블)"
          value={deviceName}
          onChange={(e) => setDeviceName(e.target.value)}
          className="h-8 text-sm"
          disabled={isExpired}
        />
      </div>
      <Button
        size="sm"
        onClick={handleApprove}
        disabled={isPending || isExpired}
        className="shrink-0 bg-green-600 hover:bg-green-700 text-white"
      >
        {isPending ? (
          <IconLoader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <IconCheck className="mr-1 h-4 w-4" />
            승인
          </>
        )}
      </Button>
    </motion.div>
  )
}

export function PendingDeviceDialog({
  open,
  onOpenChange,
}: PendingDeviceDialogProps) {
  const queryClient = useQueryClient()
  const { data: pendingDevices = [], isLoading, isFetching } = usePendingDevices()
  const approveDevice = useApproveDevice()

  // 모달 열릴 때 최신 데이터 fetch
  React.useEffect(() => {
    if (open) {
      queryClient.invalidateQueries({ queryKey: adminKeys.pendingDevices() })
    }
  }, [open, queryClient])

  const handleApprove = async (deviceId: string, deviceName?: string) => {
    try {
      await approveDevice.mutateAsync({ deviceId, deviceName })
      toast.success("디바이스가 승인되었습니다")
    } catch (error) {
      const message = error instanceof Error ? error.message : "승인에 실패했습니다"
      toast.error(message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <div className="flex items-center gap-3 pr-12">
            <DialogTitle className="flex items-center gap-2 flex-1">
              등록 요청 확인
              {pendingDevices.length > 0 && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100">
                  {pendingDevices.length}
                </Badge>
              )}
            </DialogTitle>
            <Button
              variant="outline"
              size="icon"
              onClick={() => queryClient.invalidateQueries({ queryKey: adminKeys.pendingDevices() })}
              disabled={isFetching}
              className="h-8 w-8 shrink-0"
            >
              <IconRefresh className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>
          <DialogDescription>
            모바일에서 요청한 디바이스 목록입니다. 3분 내 승인하지 않으면 만료됩니다.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : pendingDevices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <IconInbox className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground">
                대기 중인 요청이 없습니다
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                모바일 디바이스에서 등록 요청을 보내면 여기에 표시됩니다
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {pendingDevices.map((device, index) => (
                  <DeviceItem
                    key={device.deviceId}
                    device={device}
                    index={index}
                    onApprove={handleApprove}
                    isPending={approveDevice.isPending}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
