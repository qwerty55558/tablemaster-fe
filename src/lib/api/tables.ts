/**
 * Tables API 클라이언트
 * 테이블 목록 조회, 설정, 리셋
 */

import { getSession } from "next-auth/react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080"

// ================================
// 타입 정의
// ================================

export type TableStatus = "active" | "empty" | "reserved" | "inactive"

export type ChatSanctionType = "WARNING" | "MUTE" | "BAN"

export interface Table {
  tableId: string
  tableName: string
  deviceName: string
  status: TableStatus
  guestCount: number
  maleCount: number
  femaleCount: number
  location: string
  chatEnabled: boolean
  chatRoomId?: number | null
  chatSanctionType?: ChatSanctionType | null
  isChatMuted?: boolean
  chatSanctionExpiresAt?: string | null
  entryTime?: string
  updatedAt?: string
}

// 백엔드 응답 타입
interface TableApiResponse {
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
  chatSanctionType?: ChatSanctionType | null
  isChatMuted?: boolean
  chatSanctionExpiresAt?: string | null
  createdAt?: string
  updatedAt?: string
}

// 백엔드 status → 프론트 status 변환
function mapStatus(status: string): TableStatus {
  switch (status) {
    case "OCCUPIED":
    case "CHATTING":
      return "active"
    case "AVAILABLE":
      return "empty"
    case "RESERVED":
      return "reserved"
    case "INACTIVE":
    case "DELETED":
      return "inactive"
    default:
      return "empty"
  }
}

// API 응답 → 프론트 타입 변환
function mapTableResponse(data: TableApiResponse): Table {
  return {
    tableId: data.id,
    tableName: data.name,
    deviceName: data.deviceName || data.id,
    status: mapStatus(data.status),
    guestCount: data.guestCount,
    maleCount: data.maleCount ?? 0,
    femaleCount: data.femaleCount ?? 0,
    location: data.location,
    chatEnabled: data.isChatting || !!data.chatRoomId,
    chatRoomId: data.chatRoomId ?? null,
    chatSanctionType: data.chatSanctionType ?? null,
    isChatMuted: data.isChatMuted ?? false,
    chatSanctionExpiresAt: data.chatSanctionExpiresAt ?? null,
    entryTime: data.createdAt,
    updatedAt: data.updatedAt,
  }
}

// 디바이스용 (POST /tables/setup) - 디바이스가 직접 호출
export interface SetupTableRequest {
  tableId: string
  location: string
  guestCount: number
  maleCount: number
  femaleCount: number
}

// 프론트용 (POST /tables/setup/{deviceId}) - 스태프가 호출
export interface SetupTableForDeviceRequest {
  deviceId: string
  tableName: string
  location: string
  guestCount: number
  maleCount: number
  femaleCount: number
}

// 입장 기록 타입 (POST /tables/history)
export interface TableHistoryEntry {
  id: number
  deviceId: string
  deviceName: string
  name: string
  location: string
  guestCount: number
  femaleCount: number
  maleCount: number
  revenue: number
  createdAt: string
  deletedAt: string | null
}

export interface TableHistoryRequest {
  offset: number
  limit: number
}

export interface TableHistoryResponse {
  content: TableHistoryEntry[]
  totalCount: number
  offset: number
  limit: number
  hasNext: boolean
}

// 빈 디바이스 응답 타입 (GET /tables/available)
export interface AvailableDevice {
  deviceId: string
  deviceName: string
}

// 에러 응답 타입
export interface ApiErrorResponse {
  timestamp: string
  status: number
  code?: string
  error: string
  message: string
  path: string
}

// 커스텀 에러 클래스
export class TablesApiError extends Error {
  public readonly status: number
  public readonly code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = "TablesApiError"
    this.status = status
    this.code = code
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
  const isOk = response.ok;
  let text = "";
  
  try {
    text = await response.text();
  } catch {
    if (!isOk) {
      throw new TablesApiError(
        `요청 실패 (상태 코드: ${response.status})`,
        response.status
      );
    }
    return undefined as T;
  }
  
  if (!isOk) {
    let errorData: ApiErrorResponse;
    try {
      errorData = text ? JSON.parse(text) : {
        status: response.status,
        message: response.statusText,
        error: "Unknown Error",
        timestamp: new Date().toISOString(),
        path: "",
      };
    } catch {
      errorData = {
        status: response.status,
        message: text || response.statusText,
        error: "Unknown Error",
        timestamp: new Date().toISOString(),
        path: "",
      };
    }

    throw new TablesApiError(
      errorData.message || errorData.error || "요청 처리에 실패했습니다",
      errorData.status || response.status,
      errorData.code
    )
  }

  // 성공 응답 (2xx)
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
// 테이블 API
// ================================

/**
 * 테이블 목록 조회
 */
export async function fetchTables(): Promise<Table[]> {
  const headers = await getAuthHeaders()

  const response = await fetch(`${API_BASE_URL}/api/v1/tables`, {
    method: "GET",
    headers,
  })

  const data = await handleResponse<TableApiResponse[]>(response)
  return (data || []).map(mapTableResponse)
}

/**
 * 빈 디바이스 목록 조회 (테이블 미등록)
 */
export async function fetchAvailableDevices(): Promise<AvailableDevice[]> {
  const headers = await getAuthHeaders()

  const response = await fetch(`${API_BASE_URL}/api/v1/tables/available`, {
    method: "GET",
    headers,
  })

  return handleResponse<AvailableDevice[]>(response).then((data) => data || [])
}

/**
 * 테이블 상세 조회
 */
export async function fetchTable(tableId: string): Promise<Table> {
  const headers = await getAuthHeaders()

  const response = await fetch(`${API_BASE_URL}/api/v1/tables/${tableId}`, {
    method: "GET",
    headers,
  })

  const data = await handleResponse<TableApiResponse>(response)
  return mapTableResponse(data)
}

/**
 * 테이블 설정 - 디바이스용 (POST /tables/setup)
 */
export async function setupTable(data: SetupTableRequest): Promise<Table> {
  const headers = await getAuthHeaders()

  const response = await fetch(`${API_BASE_URL}/api/v1/tables/setup`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  })

  return handleResponse<Table>(response)
}

/**
 * 테이블 설정 - 프론트용 (POST /tables/setup/{deviceId})
 */
export async function setupTableForDevice(data: SetupTableForDeviceRequest): Promise<Table> {
  const { deviceId, tableName, ...rest } = data
  const headers = await getAuthHeaders()

  const response = await fetch(`${API_BASE_URL}/api/v1/tables/setup/${deviceId}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ tableId: tableName, ...rest }),
  })

  return handleResponse<Table>(response)
}

/**
 * 테이블 삭제 (관리자/스태프용)
 * 현재 목록 응답의 data.id 식별자를 그대로 사용한다.
 * 백엔드에서 deviceId 우선, tableId(name) 차선으로 해석한다.
 */
export async function deleteTable(identifier: string): Promise<void> {
  const headers = await getAuthHeaders()

  const response = await fetch(`${API_BASE_URL}/api/v1/tables/${identifier}`, {
    method: "DELETE",
    headers,
  })

  return handleResponse<void>(response)
}

/**
 * 입장 기록 조회
 * POST /tables/history
 */
export async function fetchTableHistory(
  params: TableHistoryRequest,
): Promise<TableHistoryResponse> {
  const headers = await getAuthHeaders()

  const response = await fetch(`${API_BASE_URL}/api/v1/tables/history`, {
    method: "POST",
    headers,
    body: JSON.stringify(params),
  })

  return handleResponse<TableHistoryResponse>(response)
}
