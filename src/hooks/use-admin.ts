"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  fetchDevices,
  fetchDevice,
  createDevice,
  updateDevice,
  deleteDevice,
  toggleDeviceActive,
  fetchAppSecret,
  fetchPendingDevices,
  approveDevice,
  requestDeviceRegister,
  type Device,
  type DeviceRequest,
  type AppSecretResponse,
  type PendingDevice,
  type DeviceRegisterRequest,
  type ApproveDeviceRequest,
} from "@/lib/api/admin"

// ================================
// Query Keys
// ================================

export const adminKeys = {
  all: ["admin"] as const,
  devices: () => [...adminKeys.all, "devices"] as const,
  device: (id: number) => [...adminKeys.devices(), id] as const,
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
 * 디바이스 상세 조회
 */
export function useDevice(id: number) {
  return useQuery<Device, Error>({
    queryKey: adminKeys.device(id),
    queryFn: () => fetchDevice(id),
    enabled: !!id,
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

  return useMutation<Device, Error, { id: number; data: DeviceRequest }>({
    mutationFn: ({ id, data }) => updateDevice(id, data),
    onSuccess: (updatedDevice) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.devices() })
      queryClient.setQueryData(adminKeys.device(updatedDevice.id), updatedDevice)
    },
  })
}

/**
 * 디바이스 삭제
 */
export function useDeleteDevice() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, number>({
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

  return useMutation<Device, Error, number>({
    mutationFn: toggleDeviceActive,
    onSuccess: (updatedDevice) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.devices() })
      queryClient.setQueryData(adminKeys.device(updatedDevice.id), updatedDevice)
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
 * WebSocket으로 실시간 업데이트되므로 staleTime을 길게 설정
 */
export function usePendingDevices() {
  return useQuery<PendingDevice[], Error>({
    queryKey: adminKeys.pendingDevices(),
    queryFn: fetchPendingDevices,
    staleTime: 5 * 60 * 1000, // 5분 (WebSocket으로 실시간 업데이트)
    // 자동 갱신 제거 - 새로고침 버튼으로 수동 갱신
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

/**
 * 디바이스 등록 요청 (인증 없이)
 */
export function useRequestDeviceRegister() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, DeviceRegisterRequest>({
    mutationFn: requestDeviceRegister,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.pendingDevices() })
    },
  })
}
