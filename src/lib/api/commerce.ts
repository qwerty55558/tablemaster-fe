"use client"

import { getSession } from "next-auth/react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080"

export type BillStatus = "OPEN" | "CLOSED" | "CANCELLED"

export interface BillLineItem {
  id?: number | null
  orderItemId?: number | null
  giftId?: number | null
  name?: string | null
  itemName?: string | null
  menuName?: string | null
  giftName?: string | null
  imageUrl?: string | null
  quantity?: number | null
  count?: number | null
  price?: number | null
  unitPrice?: number | null
  totalPrice?: number | null
  amount?: number | null
  createdAt?: string | null
  type?: string | null
}

export interface BillResponse {
  billId?: number | null
  id?: number | null
  tableId?: string | null
  tableName?: string | null
  deviceId?: string | null
  deviceName?: string | null
  status?: BillStatus | string | null
  totalAmount?: number | null
  amount?: number | null
  createdAt?: string | null
  openedAt?: string | null
  closedAt?: string | null
  paidAt?: string | null
  updatedAt?: string | null
  orders?: BillLineItem[] | null
  orderItems?: BillLineItem[] | null
  gifts?: BillLineItem[] | null
  giftItems?: BillLineItem[] | null
  giftOrders?: BillLineItem[] | null
}

export class CommerceApiError extends Error {
  public readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "CommerceApiError"
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
  const text = await response.text()

  if (!response.ok) {
    let message = "요청 처리에 실패했습니다"
    try {
      const errorData = text ? JSON.parse(text) : {}
      message = errorData.message || errorData.error || message
    } catch {
      // ignore parse error
    }

    throw new CommerceApiError(message, response.status)
  }

  if (!text || text.trim() === "") {
    return undefined as T
  }

  return JSON.parse(text) as T
}

export async function fetchAdminBills(status?: BillStatus | "all"): Promise<BillResponse[]> {
  const headers = await getAuthHeaders()
  const searchParams = new URLSearchParams()
  if (status && status !== "all") searchParams.set("status", status)

  const query = searchParams.toString()
  const response = await fetch(
    `${API_BASE_URL}/api/v1/admin/bills${query ? `?${query}` : ""}`,
    {
      method: "GET",
      headers,
    }
  )

  return handleResponse<BillResponse[]>(response).then((data) => data || [])
}

export async function fetchAdminBillDetail(billId: number): Promise<BillResponse> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/bills/${billId}`, {
    method: "GET",
    headers,
  })

  return handleResponse<BillResponse>(response)
}

export async function fetchTableBills(identifier: string): Promise<BillResponse[]> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_BASE_URL}/api/v1/tables/${identifier}/bills`, {
    method: "GET",
    headers,
  })

  return handleResponse<BillResponse[]>(response).then((data) => data || [])
}

export async function fetchCurrentTableBill(identifier: string): Promise<BillResponse | null> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_BASE_URL}/api/v1/tables/${identifier}/bill`, {
    method: "GET",
    headers,
  })

  if (response.status === 404) {
    return null
  }

  return handleResponse<BillResponse>(response)
}

export async function fetchTableOrders(identifier: string): Promise<BillResponse | null> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_BASE_URL}/api/v1/tables/${identifier}/orders`, {
    method: "GET",
    headers,
  })

  if (response.status === 404) {
    return null
  }

  return handleResponse<BillResponse>(response)
}

export async function closeTableBill(identifier: string): Promise<BillResponse | void> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_BASE_URL}/api/v1/tables/${identifier}/bill/close`, {
    method: "POST",
    headers,
  })

  return handleResponse<BillResponse | void>(response)
}

export function resolveCommerceImageUrl(imageUrl?: string | null): string | null {
  if (!imageUrl) return null
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl
  }
  if (imageUrl.startsWith("/")) {
    return `${API_BASE_URL}${imageUrl}`
  }
  return `${API_BASE_URL}/${imageUrl}`
}
