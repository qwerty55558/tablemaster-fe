/**
 * WebSocket 알림 타입 정의
 */

export enum NotificationType {
  DEVICE_REGISTER_REQUEST = "DEVICE_REGISTER_REQUEST",
  SYSTEM_ALERT = "SYSTEM_ALERT",
}

export interface AdminNotification {
  type: NotificationType
  message: string
  data?: Record<string, unknown>
  timestamp: string
}

export type WebSocketConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error"

// 알림 패널용 Activity 타입
export type ActivityType = "entry" | "exit" | "chat" | "warning" | "gift" | "device"

export interface Activity {
  id: number
  type: ActivityType
  message: string
  time: string
  staff: string | null
  isNew: boolean
}
