"use client"

import { getSession } from "next-auth/react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080"

export type ModerationAction =
  | "WARNING"
  | "MUTE"
  | "BAN"
  | "SANCTION_LIFTED"
  | "REPORT_APPROVED"
  | "REPORT_REJECTED"

export type ChatReportStatus = "PENDING" | "REVIEWED" | "DISMISSED"

export interface ModerationHistory {
  id: number
  chatRoomId: number | null
  tableNames: string
  reason: string | null
  action: ModerationAction
  processedAt: string
  processedBy: string | null
}

export interface ModerationHistoryDetail extends ModerationHistory {
  actionDetail: string | null
  reportId: number | null
  processedByUserId: number | null
  payload: string | null
}

export interface ChatReport {
  id: number
  chatRoomId: number
  reporterTableName: string
  reportedTableName: string
  reason: string
  status: ChatReportStatus
  reviewedBy: number | null
  reviewedAt: string | null
  createdAt: string
}

export interface ForbiddenWord {
  id: number
  word: string
  reason: string | null
  isActive: boolean
  createdByUserId: number | null
  createdByName: string | null
  createdAt: string
  updatedAt: string | null
}

export interface ForbiddenWordCreateRequest {
  word: string
  reason?: string
}

export interface ForbiddenWordUpdateRequest {
  word?: string
  reason?: string
  isActive?: boolean
}

export class ChatModerationApiError extends Error {
  public readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ChatModerationApiError"
    this.status = status
  }
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const session = await getSession()
  const headers: HeadersInit = {
    Accept: "application/json",
    "Content-Type": "application/json",
  }

  if (session?.accessToken) {
    headers.Authorization = `Bearer ${session.accessToken}`
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
      throw new ChatModerationApiError(
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

    throw new ChatModerationApiError(message, response.status)
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

export async function fetchModerationHistories(): Promise<ModerationHistory[]> {
  const headers = await getAuthHeaders()
  const response = await fetch(
    `${API_BASE_URL}/api/v1/staff/chat/moderation/histories`,
    {
      method: "GET",
      headers,
    }
  )

  return handleResponse<ModerationHistory[]>(response).then((data) => data || [])
}

export async function fetchModerationHistoryDetail(
  id: number
): Promise<ModerationHistoryDetail> {
  const headers = await getAuthHeaders()
  const response = await fetch(
    `${API_BASE_URL}/api/v1/staff/chat/moderation/histories/${id}`,
    {
      method: "GET",
      headers,
    }
  )

  return handleResponse<ModerationHistoryDetail>(response)
}

export async function fetchPendingReports(): Promise<ChatReport[]> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_BASE_URL}/api/v1/staff/chat/reports/pending`, {
    method: "GET",
    headers,
  })

  return handleResponse<ChatReport[]>(response).then((data) => data || [])
}

export async function fetchRoomReports(roomId: number): Promise<ChatReport[]> {
  const headers = await getAuthHeaders()
  const response = await fetch(
    `${API_BASE_URL}/api/v1/staff/chat/rooms/${roomId}/reports`,
    {
      method: "GET",
      headers,
    }
  )

  return handleResponse<ChatReport[]>(response).then((data) => data || [])
}

export async function reviewChatReport(
  reportId: number,
  status: Exclude<ChatReportStatus, "PENDING">
): Promise<ChatReport> {
  const headers = await getAuthHeaders()
  const response = await fetch(
    `${API_BASE_URL}/api/v1/staff/chat/reports/${reportId}/review`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ status }),
    }
  )

  return handleResponse<ChatReport>(response)
}

export async function fetchForbiddenWords(): Promise<ForbiddenWord[]> {
  const headers = await getAuthHeaders()
  const response = await fetch(
    `${API_BASE_URL}/api/v1/staff/chat/forbidden-words`,
    {
      method: "GET",
      headers,
    }
  )

  return handleResponse<ForbiddenWord[]>(response).then((data) => data || [])
}

export async function createForbiddenWord(
  data: ForbiddenWordCreateRequest
): Promise<ForbiddenWord> {
  const headers = await getAuthHeaders()
  const response = await fetch(
    `${API_BASE_URL}/api/v1/staff/chat/forbidden-words`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    }
  )

  return handleResponse<ForbiddenWord>(response)
}

export async function updateForbiddenWord(
  id: number,
  data: ForbiddenWordUpdateRequest
): Promise<ForbiddenWord> {
  const headers = await getAuthHeaders()
  const response = await fetch(
    `${API_BASE_URL}/api/v1/staff/chat/forbidden-words/${id}`,
    {
      method: "PUT",
      headers,
      body: JSON.stringify(data),
    }
  )

  return handleResponse<ForbiddenWord>(response)
}

export async function deleteForbiddenWord(id: number): Promise<void> {
  const headers = await getAuthHeaders()
  const response = await fetch(
    `${API_BASE_URL}/api/v1/staff/chat/forbidden-words/${id}`,
    {
      method: "DELETE",
      headers,
    }
  )

  return handleResponse<void>(response)
}
