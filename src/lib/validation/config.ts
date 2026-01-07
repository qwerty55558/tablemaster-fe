/**
 * 유효성 검사 설정
 * 백엔드 Config API에서 가져온 값만 사용합니다.
 */

// ================================
// 타입 정의 (API 응답 기준)
// ================================

export interface AuthValidationConfig {
  email: {
    maxLength: number
  }
  password: {
    minLength: number
    maxLength: number
    requireUppercase: boolean
    requireLowercase: boolean
    requireNumber: boolean
    requireSpecialChar: boolean
  }
  name: {
    minLength: number
    maxLength: number
  }
  phone: {
    pattern: string
  }
}

export interface ValidationConfig {
  name: {
    minLength: number
    maxLength: number
  }
  email: {
    maxLength: number
  }
  password: {
    minLength: number
    maxLength: number
    pattern: string
    requireUppercase: boolean
    requireLowercase: boolean
    requireNumber: boolean
    requireSpecialChar: boolean
  }
  phone: {
    pattern: string
  }
}

// ================================
// 비밀번호 패턴 생성 (API 응답 기반)
// ================================

function buildPasswordPattern(config: AuthValidationConfig["password"]): string {
  const parts: string[] = []
  
  if (config.requireUppercase) {
    parts.push("(?=.*[A-Z])")
  }
  if (config.requireLowercase) {
    parts.push("(?=.*[a-z])")
  }
  if (config.requireNumber) {
    parts.push("(?=.*\\d)")
  }
  if (config.requireSpecialChar) {
    parts.push("(?=.*[@$!%*#?&])")
  }
  
  return `^${parts.join("")}[A-Za-z\\d@$!%*#?&]+$`
}

// ================================
// API 응답 -> ValidationConfig 변환
// ================================

function transformApiConfig(apiConfig: AuthValidationConfig): ValidationConfig {
  return {
    name: {
      minLength: apiConfig.name.minLength,
      maxLength: apiConfig.name.maxLength,
    },
    email: {
      maxLength: apiConfig.email.maxLength,
    },
    password: {
      minLength: apiConfig.password.minLength,
      maxLength: apiConfig.password.maxLength,
      pattern: buildPasswordPattern(apiConfig.password),
      requireUppercase: apiConfig.password.requireUppercase,
      requireLowercase: apiConfig.password.requireLowercase,
      requireNumber: apiConfig.password.requireNumber,
      requireSpecialChar: apiConfig.password.requireSpecialChar,
    },
    phone: {
      pattern: apiConfig.phone.pattern,
    },
  }
}

// ================================
// 서버 사이드 fetch (SSG/ISR용)
// ================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080"

export async function fetchValidationConfig(): Promise<ValidationConfig> {
  const response = await fetch(`${API_BASE_URL}/api/v1/config/auth`, {
    method: "GET",
    headers: {
      "Accept": "application/json",
    },
    cache: "force-cache", // SSG 빌드 시 캐시
  })

  if (!response.ok) {
    throw new Error(`Config API 오류: ${response.statusText}`)
  }

  const apiConfig: AuthValidationConfig = await response.json()
  return transformApiConfig(apiConfig)
}
