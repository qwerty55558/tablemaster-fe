"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"
import {
  fetchTables,
  setupTable,
  deleteTable,
  type Table,
  type SetupTableRequest,
} from "@/lib/api/tables"

// ================================
// Query Keys
// ================================

export const tableKeys = {
  all: ["tables"] as const,
  list: () => [...tableKeys.all, "list"] as const,
}

// ================================
// 테이블 Hooks
// ================================

/**
 * 테이블 목록 조회
 * 1. 페이지 접속 시 API 호출 → 초기 데이터 로드
 * 2. WebSocket delta(TABLE_ADDED, TABLE_REMOVED, TABLE_UPDATED) → 실시간 업데이트
 * 3. 새로고침 버튼 → API 재호출로 fresh 데이터 갱신
 */
export function useTables() {
  return useQuery<Table[], Error>({
    queryKey: tableKeys.list(),
    queryFn: fetchTables,
    staleTime: 1000 * 60 * 5, // 5분 후 stale
    refetchOnWindowFocus: false, // 창 포커스 시 자동 refetch 안 함
  })
}

/**
 * 테이블 상세 조회 (목록 캐시에서 가져옴)
 * API 호출 없이 useTables() 캐시에서 해당 테이블 반환
 */
export function useTable(tableId: string | null) {
  const { data: tables, isLoading, error } = useTables()

  const table = useMemo(() => {
    if (!tableId || !tables) return undefined
    return tables.find((t) => t.tableId === tableId)
  }, [tableId, tables])

  return {
    data: table,
    isLoading,
    error,
    isError: !!error,
  }
}

/**
 * 테이블 설정 (입장 시)
 * 성공 시 목록 캐시 직접 업데이트 (WebSocket delta도 올 수 있음)
 */
export function useSetupTable() {
  const queryClient = useQueryClient()

  return useMutation<Table, Error, SetupTableRequest>({
    mutationFn: setupTable,
    onSuccess: (updatedTable) => {
      // 목록 캐시에서 해당 테이블 업데이트
      queryClient.setQueryData<Table[]>(tableKeys.list(), (old) =>
        old?.map((t) =>
          t.tableId === updatedTable.tableId ? updatedTable : t
        )
      )
    },
  })
}

/**
 * 테이블 삭제 (관리자/스태프용)
 * 성공 후 백엔드에서 TABLE_REMOVED delta 발행 → 캐시 자동 업데이트
 */
export function useDeleteTable() {
  return useMutation<void, Error, string>({
    mutationFn: deleteTable,
  })
}
