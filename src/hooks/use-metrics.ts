"use client"

import { useQuery, UseQueryOptions } from "@tanstack/react-query"
import {
  fetchAdminDashboardMetrics,
  fetchStaffDashboardMetrics,
  fetchSystemMetrics,
  fetchMetricsTimeSeries,
  type DashboardMetrics,
  type StaffMetrics,
  type SystemMetrics,
  type TimeSeriesData,
} from "@/lib/api/metrics"

// ================================
// Query Keys
// ================================

export const metricsKeys = {
  all: ["metrics"] as const,
  admin: () => [...metricsKeys.all, "admin"] as const,
  adminDashboard: () => [...metricsKeys.admin(), "dashboard"] as const,
  staff: () => [...metricsKeys.all, "staff"] as const,
  staffDashboard: (userId?: string) => [...metricsKeys.staff(), "dashboard", userId] as const,
  system: () => [...metricsKeys.all, "system"] as const,
  timeSeries: (query: string, duration: string) => [...metricsKeys.all, "timeSeries", query, duration] as const,
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

/**
 * 스태프 대시보드 메트릭 조회 훅
 */
export function useStaffDashboardMetrics(
  userId?: string,
  options?: Omit<UseQueryOptions<StaffMetrics, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: metricsKeys.staffDashboard(userId),
    queryFn: () => fetchStaffDashboardMetrics(userId),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    ...options,
  })
}

/**
 * 시스템 메트릭 조회 훅
 */
export function useSystemMetrics(
  options?: Omit<UseQueryOptions<SystemMetrics, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: metricsKeys.system(),
    queryFn: fetchSystemMetrics,
    staleTime: 10 * 1000, // 10초 (시스템 메트릭은 더 자주 갱신)
    refetchInterval: 15 * 1000, // 15초마다 자동 갱신
    ...options,
  })
}

/**
 * 시계열 메트릭 조회 훅 (차트용)
 */
export function useMetricsTimeSeries(
  query: string,
  duration: string = "24h",
  options?: Omit<UseQueryOptions<TimeSeriesData[], Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: metricsKeys.timeSeries(query, duration),
    queryFn: () => fetchMetricsTimeSeries(query, duration),
    staleTime: 60 * 1000, // 1분
    refetchInterval: 5 * 60 * 1000, // 5분마다 자동 갱신
    ...options,
  })
}
