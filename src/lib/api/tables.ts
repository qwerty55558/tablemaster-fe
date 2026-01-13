/**
 * Tables API 클라이언트
 * 테이블 목록 조회, 설정, 리셋
 */

import { getSession } from "next-auth/react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080"

// ================================
// 타입 정의
// ================================

export type TableStatus = "active" | "empty" | "reserved"

export interface Table {
  tableId: string
  tableName: string
  status: TableStatus
  guestCount: number
  maleCount: number
  femaleCount: number
  location: string
  chatEnabled: boolean
  entryTime?: string
}

// 백엔드 응답 타입
interface TableApiResponse {
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

// 백엔드 status → 프론트 status 변환
function mapStatus(status: string): TableStatus {
  switch (status) {
    case "OCCUPIED":
      return "active"
    case "EMPTY":
      return "empty"
    case "RESERVED":
      return "reserved"
    default:
      return "empty"
  }
}

// API 응답 → 프론트 타입 변환
function mapTableResponse(data: TableApiResponse): Table {
  return {
    tableId: data.id,
    tableName: data.name,
    status: mapStatus(data.status),
    guestCount: data.guestCount,
    maleCount: data.maleCount ?? 0,
    femaleCount: data.femaleCount ?? 0,
    location: data.location,
    chatEnabled: data.isChatting,
    entryTime: data.updatedAt,
  }
}

export interface SetupTableRequest {
  tableId: string
  location: string
  guestCount: number
  maleCount: number
  femaleCount: number
}

// 에러 응답 타입
export interface ApiErrorResponse {
  timestamp: string
  status: number
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
  } catch (e) {
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
      errorData.status || response.status
    )
  }

  // 성공 응답 (2xx)
  if (response.status === 204 || !text || text.trim() === "") {
    return undefined as T
  }

  try {
    return JSON.parse(text) as T
  } catch (e) {
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
 * 테이블 설정 (입장 시)
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
 * 테이블 삭제 (관리자/스태프용)
 * 백엔드에서 TABLE_REMOVED delta 발행
 */
export async function deleteTable(tableId: string): Promise<void> {
  const headers = await getAuthHeaders()

  const response = await fetch(`${API_BASE_URL}/api/v1/tables/${tableId}`, {
    method: "DELETE",
    headers,
  })

  return handleResponse<void>(response)
}
