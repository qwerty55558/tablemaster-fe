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
  return <SessionProvider>{children}</SessionProvider>
}
