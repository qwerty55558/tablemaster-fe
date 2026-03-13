"use client"

/**
 * NextAuth SessionProvider 래퍼
 * 클라이언트 컴포넌트에서 useSession 훅 사용을 위해 필요
 */

import { SessionProvider } from "next-auth/react"

interface AuthSessionProviderProps {
  children: React.ReactNode
}

export function AuthSessionProvider({ children }: AuthSessionProviderProps) {
  return (
    <SessionProvider
      refetchInterval={4 * 60} // 4분마다 세션 체크 (토큰 만료 5분 전 갱신)
      refetchOnWindowFocus={true} // 탭 전환 시 세션 체크
    >
      {children}
    </SessionProvider>
  )
}
