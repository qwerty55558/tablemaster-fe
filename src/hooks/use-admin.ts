"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  fetchDevices,
  createDevice,
  updateDevice,
  deleteDevice,
  toggleDeviceActive,
  fetchAppSecret,
  fetchPendingDevices,
  approveDevice,
  type Device,
  type DeviceRequest,
  type AppSecretResponse,
  type PendingDevice,
  type ApproveDeviceRequest,
} from "@/lib/api/admin"

// ================================
// Query Keys
// ================================

export const adminKeys = {
  all: ["admin"] as const,
  devices: () => [...adminKeys.all, "devices"] as const,
  pendingDevices: () => [...adminKeys.all, "pendingDevices"] as const,
  appSecret: () => [...adminKeys.all, "appSecret"] as const,
}

// ================================
// 디바이스 Hooks
// ================================

/**
 * 디바이스 목록 조회
 */
export function useDevices() {
  return useQuery<Device[], Error>({
    queryKey: adminKeys.devices(),
    queryFn: fetchDevices,
    staleTime: 30 * 1000, // 30초
  })
}

/**
 * 디바이스 등록
 */
export function useCreateDevice() {
  const queryClient = useQueryClient()

  return useMutation<Device, Error, DeviceRequest>({
    mutationFn: createDevice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.devices() })
    },
  })
}

/**
 * 디바이스 수정
 */
export function useUpdateDevice() {
  const queryClient = useQueryClient()

  return useMutation<Device, Error, { deviceId: string; data: { deviceName?: string } }>({
    mutationFn: ({ deviceId, data }) => updateDevice(deviceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.devices() })
    },
  })
}

/**
 * 디바이스 삭제
 */
export function useDeleteDevice() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: deleteDevice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.devices() })
    },
  })
}

/**
 * 디바이스 활성화/비활성화 토글
 */
export function useToggleDeviceActive() {
  const queryClient = useQueryClient()

  return useMutation<Device, Error, string>({
    mutationFn: toggleDeviceActive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.devices() })
    },
  })
}

// ================================
// 시크릿키 Hook
// ================================

/**
 * App Secret 조회
 */
export function useAppSecret() {
  return useQuery<AppSecretResponse, Error>({
    queryKey: adminKeys.appSecret(),
    queryFn: fetchAppSecret,
    staleTime: 5 * 60 * 1000, // 5분
  })
}

// ================================
// 펜딩 디바이스 Hooks
// ================================

/**
 * 대기 중인 디바이스 목록 조회 (TTL 3분)
 * 모달 열 때마다 최신 데이터 필요
 */
export function usePendingDevices() {
  return useQuery<PendingDevice[], Error>({
    queryKey: adminKeys.pendingDevices(),
    queryFn: fetchPendingDevices,
    staleTime: 0, // 항상 fresh 데이터 fetch
  })
}

/**
 * 디바이스 등록 승인
 */
export function useApproveDevice() {
  const queryClient = useQueryClient()

  return useMutation<Device, Error, ApproveDeviceRequest>({
    mutationFn: approveDevice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.pendingDevices() })
      queryClient.invalidateQueries({ queryKey: adminKeys.devices() })
    },
  })
}
