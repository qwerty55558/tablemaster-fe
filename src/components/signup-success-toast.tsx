"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"

export function SignupSuccessToast() {
  const hasShown = useRef(false)

  useEffect(() => {
    if (hasShown.current) return
    hasShown.current = true

    const toastId = "signup-success"

    toast.success("가입이 완료되었습니다", {
      id: toastId,
      description: "관리자 승인 후 로그인이 가능합니다.",
      duration: Infinity,
      action: {
        label: "확인",
        onClick: () => toast.dismiss(toastId),
      },
    })
  }, [])

  return null
}
