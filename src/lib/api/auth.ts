/**
 * 인증 관련 API 클라이언트
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080"

// ================================
// 타입 정의
// ================================

export interface CheckEmailResponse {
  available: boolean
  message?: string
}

export interface SignupRequest {
  name: string
  email: string
  phone: string
  password: string
  agreeService: boolean
  agreePrivacy: boolean
  agreeMarketing?: boolean
}

export interface SignupResponse {
  id: number
  name: string
  email: string
  phone: string
  createdAt: string
}

// 백엔드 에러 응답 타입
export interface ValidationError {
  objectName: string
  field: string
  rejectedValue: unknown
  code: string
  defaultMessage: string
}

export interface ApiErrorResponse {
  timestamp: string
  status: number
  error: string
  message: string
  errors?: ValidationError[]
  path: string
}

// 커스텀 에러 클래스
export class SignupError extends Error {
  public readonly status: number
  public readonly fieldErrors: Map<string, string>

  constructor(message: string, status: number, errors?: ValidationError[]) {
    super(message)
    this.name = "SignupError"
    this.status = status
    this.fieldErrors = new Map()

    if (errors) {
      errors.forEach((err) => {
        this.fieldErrors.set(err.field, err.defaultMessage)
      })
    }
  }

  getFieldError(field: string): string | undefined {
    return this.fieldErrors.get(field)
  }

  getAllFieldErrors(): Record<string, string> {
    return Object.fromEntries(this.fieldErrors)
  }
}

// ================================
// API 함수
// ================================

/**
 * 이메일 중복 확인
 * @param email - 확인할 이메일 주소
 * @returns 사용 가능 여부
 */
export async function checkEmailAvailability(email: string): Promise<CheckEmailResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/auth/check-email`,
      {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      }
    )

    if (!response.ok) {
      throw new Error(`이메일 확인 실패: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("이메일 중복 확인 오류:", error)
    throw error
  }
}

/**
 * 회원가입
 * @param data - 회원가입 데이터
 * @returns 회원가입 결과
 */
export async function signup(data: SignupRequest): Promise<SignupResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/signup`, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorData: ApiErrorResponse = await response.json().catch(() => ({
      status: response.status,
      message: response.statusText,
    }))

    // validation 에러가 있는 경우
    if (errorData.errors && errorData.errors.length > 0) {
      // 첫 번째 에러 메시지를 메인 메시지로 사용
      const firstError = errorData.errors[0]
      throw new SignupError(
        firstError.defaultMessage,
        errorData.status,
        errorData.errors
      )
    }

    // 일반 에러
    throw new SignupError(
      errorData.message || errorData.error || "회원가입에 실패했습니다",
      errorData.status || response.status
    )
  }

  return await response.json()
}
