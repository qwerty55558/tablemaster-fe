"use client"

/**
 * 세션 만료 감지 및 처리 컴포넌트
 * 토큰 갱신 실패 시 토스트 알림 후 로그인 페이지로 리디렉트
 */

import { useEffect, useRef } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function SessionExpiredHandler() {
  const { data: session } = useSession()
  const router = useRouter()
  const hasHandled = useRef(false)

  useEffect(() => {
    // 이미 처리했거나 에러가 없으면 무시
    if (hasHandled.current || session?.error !== "RefreshTokenError") {
      return
    }

    hasHandled.current = true

    const toastId = "session-expired"

    toast.error("세션이 만료되었습니다", {
      id: toastId,
      description: "보안을 위해 다시 로그인해 주세요.",
      duration: 3000,
    })

    // 3초 후 로그아웃 및 로그인 페이지로 리디렉트
    const timer = setTimeout(async () => {
      await signOut({ redirect: false })
      router.push("/login")
    }, 3000)

    return () => clearTimeout(timer)
  }, [session?.error, router])

  return null
}
