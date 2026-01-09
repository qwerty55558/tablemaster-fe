"use client"

import * as React from "react"
import { 
  IconRefresh, 
  IconAlertCircle,
  IconInbox,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DeviceTable } from "./DeviceTable"
import { DeviceFormDialog } from "./DeviceFormDialog"
import { PendingDeviceDialog } from "./PendingDeviceDialog"
import {
  useDevices,
  useDeleteDevice,
  useToggleDeviceActive,
  usePendingDevices,
} from "@/hooks/use-admin"
import type { Device } from "@/lib/api/admin"
import { toast } from "sonner"

export function DeviceManagementTab() {
  const [formOpen, setFormOpen] = React.useState(false)
  const [pendingOpen, setPendingOpen] = React.useState(false)
  const [selectedDevice, setSelectedDevice] = React.useState<Device | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<Device | null>(null)

  const { data: devices = [], isLoading, isError, error, refetch } = useDevices()
  const { data: pendingDevices = [] } = usePendingDevices()
  const deleteDevice = useDeleteDevice()
  const toggleDevice = useToggleDeviceActive()

  const handleEdit = (device: Device) => {
    setSelectedDevice(device)
    setFormOpen(true)
  }

  const handleDelete = (device: Device) => {
    setDeleteTarget(device)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    
    try {
      await deleteDevice.mutateAsync(deleteTarget.id)
      toast.success("디바이스가 삭제되었습니다")
    } catch (error) {
      const message = error instanceof Error ? error.message : "삭제에 실패했습니다"
      toast.error(message)
    } finally {
      setDeleteTarget(null)
    }
  }

  const handleToggle = async (device: Device) => {
    try {
      await toggleDevice.mutateAsync(device.id)
      toast.success(
        device.isActive
          ? "디바이스가 비활성화되었습니다"
          : "디바이스가 활성화되었습니다"
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : "상태 변경에 실패했습니다"
      toast.error(message)
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
            <CardTitle>디바이스 관리</CardTitle>
            <CardDescription>
              등록된 디바이스 목록을 관리합니다. 등록된 디바이스만 로그인이 가능합니다.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <IconRefresh className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setPendingOpen(true)}
              className="relative"
            >
              <IconInbox className="mr-2 h-4 w-4" />
              등록 요청 확인
              {pendingDevices.length > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
                  {pendingDevices.length}
                </Badge>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DeviceTable
            devices={devices}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggle={handleToggle}
          />
        </CardContent>
      </Card>

      {/* 수정 다이얼로그 */}
      <DeviceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        device={selectedDevice}
      />

      {/* 등록 요청 확인 다이얼로그 */}
      <PendingDeviceDialog
        open={pendingOpen}
        onOpenChange={setPendingOpen}
      />

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>디바이스를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.deviceName || deleteTarget?.deviceId}</strong>
              {" "}디바이스를 삭제합니다. 삭제된 디바이스는 더 이상 로그인할 수 없습니다.
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
