"use client"

import { useQuery, UseQueryOptions } from "@tanstack/react-query"
import {
  fetchAdminDashboardMetrics,
  type DashboardMetrics,
} from "@/lib/api/metrics"

// ================================
// Query Keys
// ================================

export const metricsKeys = {
  all: ["metrics"] as const,
  admin: () => [...metricsKeys.all, "admin"] as const,
  adminDashboard: () => [...metricsKeys.admin(), "dashboard"] as const,
}

// ================================
// Hooks
// ================================

/**
 * 관리자 대시보드 메트릭 조회 훅
 */
export function useAdminDashboardMetrics(
  options?: Omit<UseQueryOptions<DashboardMetrics, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: metricsKeys.adminDashboard(),
    queryFn: fetchAdminDashboardMetrics,
    staleTime: 30 * 1000, // 30초
    refetchInterval: 60 * 1000, // 1분마다 자동 갱신
    ...options,
  })
}
