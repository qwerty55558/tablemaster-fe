/**
 * WebSocket 알림 타입 정의
 */

export enum NotificationType {
  DEVICE_REGISTER_REQUEST = "DEVICE_REGISTER_REQUEST",
  DEVICE_REGISTRATION_REQUEST = "DEVICE_REGISTRATION_REQUEST", // 백엔드 실제 값
  DEVICE_CONNECTED = "DEVICE_CONNECTED",
  DEVICE_DISCONNECTED = "DEVICE_DISCONNECTED",
  DEVICE_DELETED = "DEVICE_DELETED",
  SYSTEM_ALERT = "SYSTEM_ALERT",
  // 테이블 관련
  TABLE_UPDATED = "TABLE_UPDATED",
  TABLE_RESET = "TABLE_RESET",
}

export interface AdminNotification {
  type: NotificationType | string
  message?: string
  data?: Record<string, unknown>
  timestamp?: string
  // 백엔드가 최상위에 보내는 필드
  deviceId?: string
  requestedAt?: string
  ttl?: number
}

// 테이블 업데이트 메시지 타입
export interface TableUpdateMessage {
  type: "TABLE_UPDATED" | "TABLE_RESET"
  tableId: string
  table?: {
    tableId: string
    tableName: string
    status: "active" | "empty" | "reserved"
    guestCount: number
    maleCount: number
    femaleCount: number
    location: string
    chatEnabled: boolean
    entryTime?: string
  }
  timestamp?: string
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
