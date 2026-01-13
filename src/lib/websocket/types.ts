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

export type WebSocketConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error"

// ================================
// 테이블 WebSocket 메시지 타입
// ================================

export enum TableMessageType {
  TABLE_ADDED = "TABLE_ADDED",
  TABLE_REMOVED = "TABLE_REMOVED",
  TABLE_UPDATED = "TABLE_UPDATED",
}

// 백엔드에서 오는 테이블 데이터 형태
export interface TableData {
  id: string
  name: string
  status: "OCCUPIED" | "EMPTY" | "RESERVED"
  guestCount: number
  maleCount?: number
  femaleCount?: number
  location: string
  isChatting: boolean
  updatedAt?: string
}

// WebSocket 테이블 메시지 (delta only)
export interface TableMessage {
  type: TableMessageType
  data?: TableData          // TABLE_ADDED, TABLE_UPDATED용
  id?: string               // TABLE_REMOVED용
  timestamp?: string
}

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
