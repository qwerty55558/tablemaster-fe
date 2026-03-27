/**
 * WebSocket 알림 타입 정의
 */

export enum NotificationType {
  DEVICE_REGISTRATION_REQUEST = "DEVICE_REGISTRATION_REQUEST",
  DEVICE_REGISTRATION_EXPIRED = "DEVICE_REGISTRATION_EXPIRED",
  DEVICE_CONNECTED = "DEVICE_CONNECTED",
  DEVICE_DISCONNECTED = "DEVICE_DISCONNECTED",
  DEVICE_DELETED = "DEVICE_DELETED",
  SYSTEM_ALERT = "SYSTEM_ALERT",
  ROOM_SANCTION_LIFTED = "ROOM_SANCTION_LIFTED",
  // 채팅 모니터 실시간 이벤트
  CHAT_NEW_MESSAGE = "CHAT_NEW_MESSAGE",
  CHAT_GIFT_SENT = "CHAT_GIFT_SENT",
  CHAT_GIFT_RECEIVED = "CHAT_GIFT_RECEIVED",
  CHAT_ROOM_CREATED = "CHAT_ROOM_CREATED",
  CHAT_ROOM_CLOSED = "CHAT_ROOM_CLOSED",
  CHAT_ROOM_UPDATED = "CHAT_ROOM_UPDATED",
}

export interface RoomSanctionLiftedMessage {
  type: NotificationType.ROOM_SANCTION_LIFTED
  roomId: number
  timestamp: string
}

// 채팅 모니터 WebSocket 메시지 타입
export interface ChatMonitorMessage {
  type:
    | NotificationType.CHAT_NEW_MESSAGE
    | NotificationType.CHAT_GIFT_SENT
    | NotificationType.CHAT_GIFT_RECEIVED
    | NotificationType.CHAT_ROOM_CREATED
    | NotificationType.CHAT_ROOM_CLOSED
    | NotificationType.CHAT_ROOM_UPDATED
    | NotificationType.ROOM_SANCTION_LIFTED
  roomId: number
  timestamp: string
  eventType?: string
  // CHAT_NEW_MESSAGE일 때 메시지 데이터 (백엔드 필드명 기준)
  messageId?: number
  senderDeviceId?: string
  senderTableName?: string
  content?: string
  messageType?: string
  giftType?: string
  createdAt?: string
  // CHAT_ROOM_CREATED / CHAT_ROOM_UPDATED일 때 방 데이터
  room?: {
    id: number
    status: string
    startedAt: string
    closedAt: string | null
    totalMessageCount: number
    giftCount: number
    reportCount: number
    participants: {
      deviceId: string
      tableName: string
      isMuted: boolean
    }[]
    unreadCount: number
    sanctionType?: string
    sanctionReason?: string
    sanctionExpiresAt?: string | null
  }
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
  deviceName?: string
  status: "AVAILABLE" | "OCCUPIED" | "RESERVED" | "CHATTING" | "INACTIVE" | "DELETED"
  guestCount: number
  maleCount?: number
  femaleCount?: number
  location: string
  isChatting: boolean
  chatRoomId?: number | null
  chatSanctionType?: string | null
  isChatMuted?: boolean
  chatSanctionExpiresAt?: string | null
  createdAt?: string
  updatedAt?: string
}

// WebSocket 테이블 메시지
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
  href?: string | null
}
