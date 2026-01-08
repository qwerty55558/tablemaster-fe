/**
 * NextAuth 타입 확장
 * Session, User, JWT 인터페이스 확장 정의
 */

import type { DefaultSession } from "next-auth"

// 사용자 역할 타입
export type UserRole = "ROLE_ADMIN" | "ROLE_STAFF" | "ROLE_USER"

// 백엔드 LoginResponse 타입
// user 정보는 accessToken에서 디코딩하여 추출
export interface LoginResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: string
}

// 백엔드 TokenRefreshResponse 타입
export interface TokenRefreshResponse {
  accessToken: string
  expiresIn: number
  tokenType: string
}

// 백엔드 LogoutRequest 타입
export interface LogoutRequest {
  refreshToken: string
}

// 백엔드 비밀번호 변경 요청 타입
export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  logoutOtherDevices: boolean
}

// NextAuth 타입 확장
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      roles: UserRole[]
    } & DefaultSession["user"]
    accessToken: string
    error?: "RefreshTokenError"
  }

  interface User {
    id: string
    name: string
    email: string
    roles: UserRole[]
    accessToken: string
    refreshToken: string
    accessTokenExpires: number
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    name: string
    email: string
    roles: UserRole[]
    accessToken: string
    refreshToken: string
    accessTokenExpires: number
    error?: "RefreshTokenError"
  }
}
