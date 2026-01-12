"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  fetchTables,
  fetchTable,
  setupTable,
  resetTable,
  type Table,
  type SetupTableRequest,
} from "@/lib/api/tables"

// ================================
// Query Keys
// ================================

export const tableKeys = {
  all: ["tables"] as const,
  list: () => [...tableKeys.all, "list"] as const,
  detail: (tableId: string) => [...tableKeys.all, "detail", tableId] as const,
}

// ================================
// 테이블 Hooks
// ================================

/**
 * 테이블 목록 조회
 * WebSocket으로 실시간 업데이트되므로 staleTime을 길게 설정
 */
export function useTables() {
  return useQuery<Table[], Error>({
    queryKey: tableKeys.list(),
    queryFn: fetchTables,
    staleTime: 5 * 60 * 1000, // 5분 (WebSocket으로 실시간 업데이트)
  })
}

/**
 * 테이블 상세 조회
 */
export function useTable(tableId: string) {
  return useQuery<Table, Error>({
    queryKey: tableKeys.detail(tableId),
    queryFn: () => fetchTable(tableId),
    enabled: !!tableId,
  })
}

/**
 * 테이블 설정 (입장 시)
 */
export function useSetupTable() {
  const queryClient = useQueryClient()

  return useMutation<Table, Error, SetupTableRequest>({
    mutationFn: setupTable,
    onSuccess: (updatedTable) => {
      queryClient.invalidateQueries({ queryKey: tableKeys.list() })
      queryClient.setQueryData(tableKeys.detail(updatedTable.tableId), updatedTable)
    },
  })
}

/**
 * 테이블 초기화 (관리자/스태프용)
 */
export function useResetTable() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: resetTable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tableKeys.list() })
    },
  })
}
