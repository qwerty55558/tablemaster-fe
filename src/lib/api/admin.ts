/**
 * Admin API 클라이언트
 * 디바이스 관리 및 시크릿키 조회
 */

import { getSession } from "next-auth/react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080"

// ================================
// 타입 정의
// ================================

export interface Device {
  id: number
  deviceId: string
  deviceName: string | null
  isActive: boolean
  createdAt: string
  lastLoginAt: string | null
  isConnected?: boolean // 프론트 전용 (WebSocket 연결 상태)
}

export interface DeviceRequest {
  deviceId: string
  deviceName?: string
}

export interface AppSecretResponse {
  appSecret: string
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
export class AdminApiError extends Error {
  public readonly status: number
  public readonly code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = "AdminApiError"
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
      throw new AdminApiError(
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

    throw new AdminApiError(
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
// 디바이스 API
// ================================

/**
 * 디바이스 목록 조회
 */
export async function fetchDevices(): Promise<Device[]> {
  const headers = await getAuthHeaders()

  const response = await fetch(`${API_BASE_URL}/api/v1/admin/devices`, {
    method: "GET",
    headers,
  })

  const data = await handleResponse<Device[]>(response)
  return data || []
}

/**
 * 디바이스 상세 조회
 */
export async function fetchDevice(deviceId: string): Promise<Device> {
  const headers = await getAuthHeaders()

  const response = await fetch(`${API_BASE_URL}/api/v1/admin/devices/${deviceId}`, {
    method: "GET",
    headers,
  })

  return handleResponse<Device>(response)
}

/**
 * 디바이스 등록
 */
export async function createDevice(data: DeviceRequest): Promise<Device> {
  const headers = await getAuthHeaders()

  const response = await fetch(`${API_BASE_URL}/api/v1/admin/devices`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  })

  return handleResponse<Device>(response)
}

/**
 * 디바이스 수정
 */
export async function updateDevice(deviceId: string, data: Omit<DeviceRequest, 'deviceId'>): Promise<Device> {
  const headers = await getAuthHeaders()

  const response = await fetch(`${API_BASE_URL}/api/v1/admin/devices/${deviceId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(data),
  })

  return handleResponse<Device>(response)
}

/**
 * 디바이스 삭제
 */
export async function deleteDevice(deviceId: string): Promise<void> {
  const headers = await getAuthHeaders()

  const response = await fetch(`${API_BASE_URL}/api/v1/admin/devices/${deviceId}`, {
    method: "DELETE",
    headers,
  })

  return handleResponse<void>(response)
}

/**
 * 디바이스 활성화/비활성화 토글
 */
export async function toggleDeviceActive(deviceId: string): Promise<Device> {
  const headers = await getAuthHeaders()

  const response = await fetch(`${API_BASE_URL}/api/v1/admin/devices/${deviceId}/toggle`, {
    method: "PATCH",
    headers,
  })

  return handleResponse<Device>(response)
}

// ================================
// 시크릿키 API
// ================================

/**
 * App Secret 조회
 */
export async function fetchAppSecret(): Promise<AppSecretResponse> {
  const headers = await getAuthHeaders()

  const response = await fetch(`${API_BASE_URL}/api/v1/admin/devices/secret`, {
    method: "GET",
    headers,
  })

  return handleResponse<AppSecretResponse>(response)
}

// ================================
// 펜딩 디바이스 API
// ================================

export interface PendingDevice {
  deviceId: string
  requestedAt: string
  ttl: number
}

/**
 * 대기 중인 디바이스 목록 조회 (TTL 3분)
 */
export async function fetchPendingDevices(): Promise<PendingDevice[]> {
  const headers = await getAuthHeaders()

  const response = await fetch(`${API_BASE_URL}/api/v1/admin/devices/pending`, {
    method: "GET",
    headers,
  })

  return handleResponse<PendingDevice[]>(response)
}

export interface ApproveDeviceRequest {
  deviceId: string
  deviceName?: string
}

/**
 * 디바이스 등록 승인
 */
export async function approveDevice(data: ApproveDeviceRequest): Promise<Device> {
  const headers = await getAuthHeaders()

  const response = await fetch(`${API_BASE_URL}/api/v1/admin/devices/approve/${data.deviceId}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ deviceName: data.deviceName }),
  })

  return handleResponse<Device>(response)
}

// ================================
// 디바이스 등록 요청 API (인증 없이)
// ================================

export interface DeviceRegisterRequest {
  deviceId: string
  appSecret: string
}

/**
 * 디바이스 등록 요청
 * 관리자 승인 후 로그인 가능 (TTL 3분)
 */
export async function requestDeviceRegister(data: DeviceRegisterRequest): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/device/register`, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })

  return handleResponse<void>(response)
}
