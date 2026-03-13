/**
 * Staff Chat API 클라이언트
 * 채팅방 목록, 메시지 조회, 제재, 음소거, 알림
 */

import { getSession } from "next-auth/react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080"

// ================================
// 타입 정의
// ================================

export type ChatRoomStatus = "ACTIVE" | "CLOSED" | "SANCTIONED"

export type MessageType = "MESSAGE" | "JOIN" | "LEAVE" | "GIFT" | "SYSTEM"

export interface ChatParticipant {
  deviceId: string
  tableName: string
  isMuted: boolean
}

export interface ChatRoom {
  id: number
  status: ChatRoomStatus
  startedAt: string
  closedAt: string | null
  totalMessageCount: number
  giftCount: number
  reportCount: number
  participants: ChatParticipant[]
  unreadCount: number
}

export interface ChatMessage {
  id: number
  chatRoomId: number
  senderDeviceId: string
  senderTableName: string
  content: string
  type: MessageType
  createdAt: string
}

export interface ChatMessagesResponse {
  totalPages: number
  totalElements: number
  numberOfElements: number
  first: boolean
  last: boolean
  size: number
  content: ChatMessage[]
  number: number
  empty: boolean
}

export interface NotifyRequest {
  title: string
  message: string
}

// ================================
// 에러 클래스
// ================================

export class ChatApiError extends Error {
  public readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ChatApiError"
    this.status = status
  }
}

// ================================
// 헬퍼 함수
// ================================

async function getAuthHeaders(): Promise<HeadersInit> {
  const session = await getSession()
  const headers: HeadersInit = {
    "Accept": "application/json",
    "Content-Type": "application/json",
  }

  if (session?.accessToken) {
    headers["Authorization"] = `Bearer ${session.accessToken}`
  }

  return headers
}

async function handleResponse<T>(response: Response): Promise<T> {
  const isOk = response.ok
  let text = ""

  try {
    text = await response.text()
  } catch {
    if (!isOk) {
      throw new ChatApiError(
        `요청 실패 (상태 코드: ${response.status})`,
        response.status
      )
    }
    return undefined as T
  }

  if (!isOk) {
    let message = "요청 처리에 실패했습니다"
    try {
      const errorData = text ? JSON.parse(text) : {}
      message = errorData.message || errorData.error || message
    } catch {
      // ignore parse error
    }
    throw new ChatApiError(message, response.status)
  }

  if (response.status === 204 || !text || text.trim() === "") {
    return undefined as T
  }

  try {
    return JSON.parse(text) as T
  } catch {
    return text as unknown as T
  }
}

// ================================
// Chat API
// ================================

/**
 * 채팅방 목록 조회
 * GET /api/v1/staff/chat/rooms
 */
export async function fetchChatRooms(params?: {
  search?: string
  filter?: string
}): Promise<ChatRoom[]> {
  const headers = await getAuthHeaders()
  const searchParams = new URLSearchParams()
  if (params?.search) searchParams.set("search", params.search)
  if (params?.filter) searchParams.set("filter", params.filter)

  const query = searchParams.toString()
  const url = `${API_BASE_URL}/api/v1/staff/chat/rooms${query ? `?${query}` : ""}`

  const response = await fetch(url, { method: "GET", headers })
  return handleResponse<ChatRoom[]>(response).then((data) => data || [])
}

/**
 * 채팅방 상세 조회
 * GET /api/v1/staff/chat/rooms/{id}
 */
export async function fetchChatRoom(id: number): Promise<ChatRoom> {
  const headers = await getAuthHeaders()

  const response = await fetch(`${API_BASE_URL}/api/v1/staff/chat/rooms/${id}`, {
    method: "GET",
    headers,
  })

  return handleResponse<ChatRoom>(response)
}

/**
 * 채팅 메시지 목록 조회
 * GET /api/v1/staff/chat/rooms/{id}/messages
 */
export async function fetchChatMessages(
  roomId: number,
  params?: { page?: number; size?: number }
): Promise<ChatMessagesResponse> {
  const headers = await getAuthHeaders()
  const searchParams = new URLSearchParams()
  if (params?.page !== undefined) searchParams.set("page", String(params.page))
  if (params?.size !== undefined) searchParams.set("size", String(params.size))

  const query = searchParams.toString()
  const url = `${API_BASE_URL}/api/v1/staff/chat/rooms/${roomId}/messages${query ? `?${query}` : ""}`

  const response = await fetch(url, { method: "GET", headers })
  return handleResponse<ChatMessagesResponse>(response)
}

export type SanctionType = "WARNING" | "MUTE" | "BAN"

/**
 * 채팅방 제재
 * POST /api/v1/staff/chat/rooms/{id}/sanction
 */
export async function sanctionChatRoom(
  roomId: number,
  data: { type: SanctionType; reason?: string }
): Promise<void> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${API_BASE_URL}/api/v1/staff/chat/rooms/${roomId}/sanction`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    }
  )

  return handleResponse<void>(response)
}

/**
 * 읽음 처리
 * POST /api/v1/staff/chat/rooms/{id}/read
 */
export async function markChatAsRead(
  roomId: number,
  lastMessageId: number
): Promise<void> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${API_BASE_URL}/api/v1/staff/chat/rooms/${roomId}/read`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ lastMessageId }),
    }
  )

  return handleResponse<void>(response)
}

/**
 * 참여자 음소거 토글
 * POST /api/v1/staff/chat/rooms/{id}/mute
 */
export async function toggleMute(
  roomId: number,
  deviceId: string
): Promise<Record<string, boolean>> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${API_BASE_URL}/api/v1/staff/chat/rooms/${roomId}/mute`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ deviceId }),
    }
  )

  return handleResponse<Record<string, boolean>>(response)
}

/**
 * 디바이스 알림 전송
 * POST /api/v1/staff/chat/notify/{deviceId}
 */
export async function notifyDevice(
  deviceId: string,
  data: NotifyRequest
): Promise<void> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${API_BASE_URL}/api/v1/staff/chat/notify/${deviceId}`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    }
  )

  return handleResponse<void>(response)
}
