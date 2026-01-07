"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState, type ReactNode } from "react"

interface QueryProviderProps {
  children: ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // SSR 환경에서 클라이언트에서 즉시 refetch 하지 않도록
            staleTime: 60 * 1000,
            // 에러 발생 시 재시도 횟수
            retry: 1,
            // 윈도우 포커스 시 refetch
            refetchOnWindowFocus: true,
            // 네트워크 재연결 시 refetch
            refetchOnReconnect: true,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
