"use client"

import * as React from "react"
import { motion } from "framer-motion"
import {
  IconDots,
  IconEdit,
  IconTrash,
  IconToggleLeft,
  IconToggleRight,
  IconCopy,
} from "@tabler/icons-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import type { Device } from "@/lib/api/admin"
import type { Table as TableData } from "@/lib/api/tables"
import { toast } from "sonner"
import { motionConfig } from "@/components/motion"

interface DeviceTableProps {
  devices: Device[]
  tables: TableData[]
  isLoading?: boolean
  onEdit: (device: Device) => void
  onDelete: (device: Device) => void
  onToggle: (device: Device) => void
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "-"
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return "-"
  
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return "방금 전"
  if (diffMins < 60) return `${diffMins}분 전`
  if (diffHours < 24) return `${diffHours}시간 전`
  if (diffDays < 7) return `${diffDays}일 전`
  
  return formatDate(dateString)
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
  toast.success("클립보드에 복사되었습니다")
}

function TableSkeleton() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-5 w-14" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-8 w-8" /></TableCell>
        </TableRow>
      ))}
    </>
  )
}

function EmptyState() {
  return (
    <TableRow>
      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
        등록된 디바이스가 없습니다
      </TableCell>
    </TableRow>
  )
}

export function DeviceTable({
  devices,
  tables,
  isLoading,
  onEdit,
  onDelete,
  onToggle,
}: DeviceTableProps) {
  // deviceId로 테이블 찾기
  const getTableName = (deviceId: string) => {
    const table = tables.find((t) => t.tableId === deviceId)
    return table?.tableName || null
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>테이블 이름</TableHead>
          <TableHead>디바이스 이름</TableHead>
          <TableHead>Device ID</TableHead>
          <TableHead>상태</TableHead>
          <TableHead>마지막 접속</TableHead>
          <TableHead className="w-12"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableSkeleton />
        ) : devices.length === 0 ? (
          <EmptyState />
        ) : (
          devices.map((device, index) => (
            <motion.tr
              key={device.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: motionConfig.duration.normal,
                delay: index * motionConfig.stagger.fast,
                ease: motionConfig.ease.default,
              }}
              className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
            >
              <TableCell className="font-medium">
                {getTableName(device.deviceId) || (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                {device.deviceName || (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                    {device.deviceId}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(device.deviceId)}
                  >
                    <IconCopy className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant={device.isActive ? "default" : "secondary"}
                  className={
                    device.isActive
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                      : ""
                  }
                >
                  {device.isActive ? "활성" : "비활성"}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatRelativeTime(device.lastLoginAt)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <IconDots className="h-4 w-4" />
                      <span className="sr-only">메뉴 열기</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(device)}>
                      <IconEdit className="mr-2 h-4 w-4" />
                      수정
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onToggle(device)}>
                      {device.isActive ? (
                        <>
                          <IconToggleLeft className="mr-2 h-4 w-4" />
                          비활성화
                        </>
                      ) : (
                        <>
                          <IconToggleRight className="mr-2 h-4 w-4" />
                          활성화
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(device)}
                      className="text-destructive focus:text-destructive"
                    >
                      <IconTrash className="mr-2 h-4 w-4" />
                      삭제
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </motion.tr>
          ))
        )}
      </TableBody>
    </Table>
  )
}
