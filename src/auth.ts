/**
 * NextAuth 설정
 * Credentials, Google, Kakao 프로바이더 지원
 * JWT 토큰 갱신 및 세션 관리
 */

import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import Kakao from "next-auth/providers/kakao"
import type { JWT } from "next-auth/jwt"
import type { LoginResponse, TokenRefreshResponse, UserRole } from "@/lib/auth/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080"

// JWT 토큰 페이로드 타입
interface JwtPayload {
  sub: string
  name: string
  email: string
  roles: UserRole[]
  iat: number
  exp: number
}

/**
 * JWT Access Token 디코딩
 * Base64 디코딩하여 페이로드 추출
 */
function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const base64Payload = token.split(".")[1]
    const payload = Buffer.from(base64Payload, "base64").toString("utf-8")
    return JSON.parse(payload)
  } catch {
    return null
  }
}

/**
 * Access Token 갱신 함수
 */
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken: token.refreshToken }),
    })

    if (!response.ok) {
      throw new Error("RefreshTokenError")
    }

    const data: TokenRefreshResponse = await response.json()

    // 새 Access Token에서 정보 추출 (갱신된 정보 반영)
    const payload = decodeJwtPayload(data.accessToken)

    return {
      ...token,
      accessToken: data.accessToken,
      accessTokenExpires: Date.now() + data.expiresIn * 1000,
      // 토큰에서 최신 정보 업데이트
      ...(payload && {
        name: payload.name,
        email: payload.email,
        roles: payload.roles,
      }),
    }
  } catch {
    // 갱신 실패 시 에러 상태 반환
    return {
      ...token,
      error: "RefreshTokenError",
    }
  }
}

/**
 * 백엔드 로그아웃 API 호출
 * Refresh Token 무효화
 */
async function logoutFromBackend(refreshToken: string, accessToken: string): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ refreshToken }),
    })
  } catch (error) {
    // 로그아웃 실패해도 클라이언트 세션은 삭제됨
    console.error("Backend logout failed:", error)
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    // 이메일/비밀번호 로그인
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })

          if (!response.ok) {
            return null
          }

          const data: LoginResponse = await response.json()

          // Access Token에서 사용자 정보 디코딩
          const payload = decodeJwtPayload(data.accessToken)
          if (!payload) {
            return null
          }

          // User 객체 반환 (JWT 콜백에서 처리)
          return {
            id: payload.sub,
            name: payload.name,
            email: payload.email,
            roles: payload.roles,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            accessTokenExpires: Date.now() + data.expiresIn * 1000,
          }
        } catch {
          return null
        }
      },
    }),

    // Google OAuth (환경변수 설정 시 활성화)
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
          }),
        ]
      : []),

    // Kakao OAuth (환경변수 설정 시 활성화)
    ...(process.env.AUTH_KAKAO_ID && process.env.AUTH_KAKAO_SECRET
      ? [
          Kakao({
            clientId: process.env.AUTH_KAKAO_ID,
            clientSecret: process.env.AUTH_KAKAO_SECRET,
          }),
        ]
      : []),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // 최초 로그인 시 - 백엔드에서 받은 정보 저장
      if (user) {
        token.id = user.id
        token.name = user.name ?? ""
        token.email = user.email ?? ""
        token.roles = user.roles
        token.accessToken = user.accessToken
        token.refreshToken = user.refreshToken
        token.accessTokenExpires = user.accessTokenExpires
        return token
      }

      // 토큰이 아직 유효한 경우 (만료 5분 전까지)
      const REFRESH_THRESHOLD = 5 * 60 * 1000 // 5분
      if (Date.now() < token.accessTokenExpires - REFRESH_THRESHOLD) {
        return token
      }

      // 만료 임박 또는 만료됨 - 토큰 갱신
      return await refreshAccessToken(token)
    },

    async session({ session, token }) {
      // 클라이언트에 필요한 정보만 노출
      session.user.id = token.id
      session.user.name = token.name
      session.user.email = token.email
      session.user.roles = token.roles
      session.accessToken = token.accessToken

      // 갱신 실패 시 에러 전달
      if (token.error) {
        session.error = token.error
      }

      return session
    },
  },

  events: {
    // 로그아웃 시 백엔드 API 호출하여 Refresh Token 무효화
    async signOut(message) {
      if ("token" in message && message.token?.refreshToken && message.token?.accessToken) {
        await logoutFromBackend(message.token.refreshToken, message.token.accessToken)
      }
    },
  },

  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
    // Access Token 만료 시간과 동기화 (30분)
    maxAge: 30 * 60,
  },
})
