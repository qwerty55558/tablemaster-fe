"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCreateDevice, useUpdateDevice } from "@/hooks/use-admin"
import type { Device } from "@/lib/api/admin"
import { toast } from "sonner"

interface DeviceFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  device?: Device | null // null이면 등록, 있으면 수정
}

interface FormData {
  deviceId: string
  deviceName: string
}

export function DeviceFormDialog({
  open,
  onOpenChange,
  device,
}: DeviceFormDialogProps) {
  const isEdit = !!device
  const createDevice = useCreateDevice()
  const updateDevice = useUpdateDevice()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      deviceId: device?.deviceId || "",
      deviceName: device?.deviceName || "",
    },
  })

  // device가 바뀔 때 폼 리셋
  React.useEffect(() => {
    if (open) {
      reset({
        deviceId: device?.deviceId || "",
        deviceName: device?.deviceName || "",
      })
    }
  }, [device, open, reset])

  const onSubmit = async (data: FormData) => {
    try {
      if (isEdit && device) {
        await updateDevice.mutateAsync({
          deviceId: device.deviceId,
          data: { deviceName: data.deviceName || undefined },
        })
        toast.success("디바이스가 수정되었습니다")
      } else {
        await createDevice.mutateAsync({
          deviceId: data.deviceId,
          deviceName: data.deviceName || undefined,
        })
        toast.success("디바이스가 등록되었습니다")
      }
      onOpenChange(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : "오류가 발생했습니다"
      toast.error(message)
    }
  }

  const isPending = createDevice.isPending || updateDevice.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "디바이스 수정" : "디바이스 등록"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "디바이스 정보를 수정합니다."
              : "새로운 디바이스를 화이트리스트에 등록합니다."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deviceId">Device ID *</Label>
            <Input
              id="deviceId"
              placeholder="예: device-001"
              {...register("deviceId", {
                required: "Device ID는 필수입니다",
                minLength: {
                  value: 3,
                  message: "최소 3자 이상 입력해주세요",
                },
              })}
              disabled={isEdit} // 수정 시에는 Device ID 변경 불가
            />
            {errors.deviceId && (
              <p className="text-sm text-destructive">{errors.deviceId.message}</p>
            )}
            {isEdit && (
              <p className="text-xs text-muted-foreground">
                Device ID는 수정할 수 없습니다
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="deviceName">디바이스 이름</Label>
            <Input
              id="deviceName"
              placeholder="예: 1번 테이블 태블릿"
              {...register("deviceName")}
            />
            <p className="text-xs text-muted-foreground">
              관리를 위한 별칭 (선택사항)
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              취소
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "처리 중..." : isEdit ? "수정" : "등록"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
