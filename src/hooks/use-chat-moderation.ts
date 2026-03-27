"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  createForbiddenWord,
  deleteForbiddenWord,
  fetchForbiddenWords,
  fetchModerationHistories,
  fetchModerationHistoryDetail,
  fetchPendingReports,
  fetchRoomReports,
  reviewChatReport,
  updateForbiddenWord,
  type ChatReport,
  type ChatReportStatus,
  type ForbiddenWord,
  type ForbiddenWordCreateRequest,
  type ForbiddenWordUpdateRequest,
  type ModerationHistory,
  type ModerationHistoryDetail,
} from "@/lib/api/chat-moderation"

export const chatModerationKeys = {
  all: ["chat-moderation"] as const,
  histories: () => [...chatModerationKeys.all, "histories"] as const,
  historyDetail: (id: number | null) =>
    [...chatModerationKeys.all, "history-detail", id] as const,
  pendingReports: () => [...chatModerationKeys.all, "pending-reports"] as const,
  roomReports: (roomId: number | null) =>
    [...chatModerationKeys.all, "room-reports", roomId] as const,
  forbiddenWords: () => [...chatModerationKeys.all, "forbidden-words"] as const,
}

export function useModerationHistories() {
  return useQuery<ModerationHistory[], Error>({
    queryKey: chatModerationKeys.histories(),
    queryFn: fetchModerationHistories,
    staleTime: 30 * 1000,
  })
}

export function useModerationHistoryDetail(id: number | null) {
  return useQuery<ModerationHistoryDetail, Error>({
    queryKey: chatModerationKeys.historyDetail(id),
    queryFn: () => fetchModerationHistoryDetail(id as number),
    enabled: id !== null,
    staleTime: 30 * 1000,
  })
}

export function usePendingReports() {
  return useQuery<ChatReport[], Error>({
    queryKey: chatModerationKeys.pendingReports(),
    queryFn: fetchPendingReports,
    staleTime: 10 * 1000,
    refetchInterval: 15 * 1000,
  })
}

export function useRoomReports(roomId: number | null) {
  return useQuery<ChatReport[], Error>({
    queryKey: chatModerationKeys.roomReports(roomId),
    queryFn: () => fetchRoomReports(roomId as number),
    enabled: roomId !== null,
    staleTime: 10 * 1000,
  })
}

export function useReviewChatReport() {
  const queryClient = useQueryClient()

  return useMutation<
    ChatReport,
    Error,
    { reportId: number; status: Exclude<ChatReportStatus, "PENDING"> }
  >({
    mutationFn: ({ reportId, status }) => reviewChatReport(reportId, status),
    onSuccess: (report) => {
      queryClient.invalidateQueries({ queryKey: chatModerationKeys.pendingReports() })
      queryClient.invalidateQueries({ queryKey: chatModerationKeys.histories() })
      queryClient.invalidateQueries({
        queryKey: chatModerationKeys.roomReports(report.chatRoomId),
      })
    },
  })
}

export function useForbiddenWords() {
  return useQuery<ForbiddenWord[], Error>({
    queryKey: chatModerationKeys.forbiddenWords(),
    queryFn: fetchForbiddenWords,
    staleTime: 30 * 1000,
  })
}

export function useCreateForbiddenWord() {
  const queryClient = useQueryClient()

  return useMutation<ForbiddenWord, Error, ForbiddenWordCreateRequest>({
    mutationFn: createForbiddenWord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatModerationKeys.forbiddenWords() })
    },
  })
}

export function useUpdateForbiddenWord() {
  const queryClient = useQueryClient()

  return useMutation<
    ForbiddenWord,
    Error,
    { id: number; data: ForbiddenWordUpdateRequest }
  >({
    mutationFn: ({ id, data }) => updateForbiddenWord(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatModerationKeys.forbiddenWords() })
    },
  })
}

export function useDeleteForbiddenWord() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, number>({
    mutationFn: deleteForbiddenWord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatModerationKeys.forbiddenWords() })
    },
  })
}
