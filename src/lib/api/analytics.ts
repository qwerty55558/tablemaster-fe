"use client"

import { getSession } from "next-auth/react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080"

export interface AnalyticsSummaryDailyItem {
  date: string
  visitorEnterCount: number
  visitorExitCount: number
  chatMessageCount: number
  chatGiftCount: number
  chatReportCount: number
}

export interface AnalyticsSummaryResponse {
  from: string
  to: string
  visitor: {
    enterCount: number
    exitCount: number
    reconnectCount: number
    updateCount: number
    totalGuestCount: number
  }
  chat: {
    roomCreatedCount: number
    roomClosedCount: number
    messageCount: number
    giftCount: number
    reportCount: number
  }
  daily: AnalyticsSummaryDailyItem[]
}

export class AnalyticsApiError extends Error {
  public readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "AnalyticsApiError"
    this.status = status
  }
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const session = await getSession()
  const headers: HeadersInit = {
    Accept: "application/json",
    "Content-Type": "application/json",
  }

  if (session?.accessToken) {
    headers.Authorization = `Bearer ${session.accessToken}`
  }

  return headers
}

async function handleResponse<T>(response: Response): Promise<T> {
  const isOk = response.ok
  const text = await response.text()

  if (!isOk) {
    let message = "통계 조회에 실패했습니다"
    try {
      const errorData = text ? JSON.parse(text) : {}
      message = errorData.message || errorData.error || message
    } catch {
      // ignore
    }
    throw new AnalyticsApiError(message, response.status)
  }

  if (!text || text.trim() === "") {
    return undefined as T
  }

  return JSON.parse(text) as T
}

export async function fetchAnalyticsSummary(params?: {
  from?: string
  to?: string
}): Promise<AnalyticsSummaryResponse> {
  const headers = await getAuthHeaders()
  const searchParams = new URLSearchParams()

  if (params?.from) searchParams.set("from", params.from)
  if (params?.to) searchParams.set("to", params.to)

  const query = searchParams.toString()
  const url = `${API_BASE_URL}/api/v1/admin/analytics/summary${query ? `?${query}` : ""}`
  const response = await fetch(url, { method: "GET", headers })

  return handleResponse<AnalyticsSummaryResponse>(response)
}
