"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react"
import { useSession } from "next-auth/react"
import { useQueryClient } from "@tanstack/react-query"
import type { Client } from "@stomp/stompjs"
import { createStompClient, publishToTable, ADMIN_TOPIC, TABLES_TOPIC, STAFF_CHAT_MONITOR_TOPIC } from "@/lib/websocket/stomp-client"
import {
  NotificationType,
  type AdminNotification,
  type Activity,
  type WebSocketConnectionStatus,
  TableMessageType,
  type TableMessage,
  type TableData,
  type ChatMonitorMessage,
} from "@/lib/websocket/types"
import { adminKeys } from "@/hooks/use-admin"
import { tableKeys } from "@/hooks/use-tables"
import type { Device } from "@/lib/api/admin"
import type { Table } from "@/lib/api/tables"

interface NotificationContextValue {
  notifications: Activity[]
  unreadCount: number
  isShaking: boolean
  connectionStatus: WebSocketConnectionStatus
  markAllAsRead: () => void
  removeNotification: (id: number) => void
  clearAllNotifications: () => void
  publishTableReset: (tableId: string) => boolean
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext)
  // Context 없으면 기본값 반환 (Staff 페이지 등에서 사용 시)
  if (!context) {
    return {
      notifications: [],
      unreadCount: 0,
      isShaking: false,
      connectionStatus: "disconnected",
      markAllAsRead: () => {},
      removeNotification: () => {},
      clearAllNotifications: () => {},
      publishTableReset: () => false,
    }
  }
  return context
}

let notificationIdCounter = 1

function formatTimeAgo(): string {
  return "방금 전"
}

function getDefaultMessage(type: string, data?: Record<string, unknown>): string {
  const deviceId = data?.deviceId as string
  switch (type) {
    case NotificationType.DEVICE_REGISTRATION_REQUEST:
      return deviceId
        ? `새로운 디바이스 연결 요청: ${deviceId.substring(0, 8)}...`
        : "새로운 디바이스 연결 요청"
    case NotificationType.DEVICE_REGISTRATION_EXPIRED:
      return deviceId
        ? `디바이스 등록 만료: ${deviceId.substring(0, 8)}...`
        : "디바이스 등록 요청이 만료되었습니다"
    case NotificationType.DEVICE_CONNECTED:
      return deviceId ? `디바이스 연결됨: ${deviceId}` : "디바이스 연결됨"
    case NotificationType.DEVICE_DISCONNECTED:
      return deviceId ? `디바이스 연결 해제: ${deviceId}` : "디바이스 연결 해제"
    case NotificationType.DEVICE_DELETED:
      return deviceId ? `디바이스 삭제됨: ${deviceId}` : "디바이스 삭제됨"
    case NotificationType.SYSTEM_ALERT:
      return "시스템 알림"
    default:
      return "새로운 알림"
  }
}

// 백엔드 TableData → 프론트 Table 타입 변환
function mapTableDataToTable(data: TableData): Table {
  const statusMap: Record<string, Table["status"]> = {
    OCCUPIED: "active",
    CHATTING: "active",
    AVAILABLE: "empty",
    RESERVED: "reserved",
    INACTIVE: "inactive",
    DELETED: "inactive",
  }
  return {
    tableId: data.id,
    tableName: data.name,
    deviceName: data.deviceName || data.id,
    status: statusMap[data.status] || "empty",
    guestCount: data.guestCount,
    maleCount: data.maleCount ?? 0,
    femaleCount: data.femaleCount ?? 0,
    location: data.location,
    chatEnabled: data.isChatting || !!data.chatRoomId,
    chatRoomId: data.chatRoomId ?? null,
    chatSanctionType: (data.chatSanctionType as Table["chatSanctionType"]) ?? null,
    isChatMuted: data.isChatMuted ?? false,
    chatSanctionExpiresAt: data.chatSanctionExpiresAt ?? null,
    entryTime: data.createdAt,
    updatedAt: data.updatedAt,
  }
}

function mapNotificationToActivity(notification: AdminNotification): Activity {
  const typeMap: Record<string, Activity["type"]> = {
    [NotificationType.DEVICE_REGISTRATION_REQUEST]: "device",
    [NotificationType.DEVICE_REGISTRATION_EXPIRED]: "device",
    [NotificationType.DEVICE_CONNECTED]: "device",
    [NotificationType.DEVICE_DISCONNECTED]: "device",
    [NotificationType.DEVICE_DELETED]: "device",
    [NotificationType.SYSTEM_ALERT]: "warning",
  }

  // deviceId 위치 유연하게 처리 (최상위 or data 안)
  const deviceId = notification.deviceId || (notification.data?.deviceId as string)
  const data = { ...notification.data, deviceId }

  // 메시지가 없으면 기본 메시지 생성
  const message = notification.message || getDefaultMessage(notification.type as string, data)

  return {
    id: notificationIdCounter++,
    type: typeMap[notification.type as string] || "warning",
    message,
    time: formatTimeAgo(),
    staff: null,
    isNew: true,
  }
}

export function AdminNotificationProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const queryClient = useQueryClient()
  const clientRef = useRef<Client | null>(null)
  const prevTokenRef = useRef<string | undefined>(undefined)

  const [notifications, setNotifications] = useState<Activity[]>([])
  const [connectionStatus, setConnectionStatus] =
    useState<WebSocketConnectionStatus>("disconnected")
  const [isShaking, setIsShaking] = useState(false)

  const roles = session?.user?.roles ?? []
  const isAdmin = roles.includes("ROLE_ADMIN")
  const isStaff = roles.includes("ROLE_STAFF")
  const canConnect = isAdmin || isStaff // Admin 또는 Staff 역할 필요
  const accessToken = session?.accessToken
  const hasError = session?.error === "RefreshTokenError"

  const unreadCount = notifications.filter((n) => n.isNew).length

  const addNotification = useCallback(
    (notification: AdminNotification) => {
      const activity = mapNotificationToActivity(notification)
      setNotifications((prev) => [activity, ...prev])

      // 벨 흔들림 애니메이션
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 500)

      // deviceId 위치 유연하게 처리 (최상위 or data 안)
      const deviceId = notification.deviceId || (notification.data?.deviceId as string)
      const notificationType = notification.type as string

      // 디바이스 등록 요청이면 pending 목록 refetch
      if (
        notificationType === NotificationType.DEVICE_REGISTRATION_REQUEST
      ) {
        queryClient.invalidateQueries({ queryKey: adminKeys.pendingDevices() })
      }

      // 디바이스 등록 만료 시 pending 목록에서 제거
      if (notificationType === NotificationType.DEVICE_REGISTRATION_EXPIRED) {
        queryClient.invalidateQueries({ queryKey: adminKeys.pendingDevices() })
      }

      // 디바이스 연결 상태 업데이트
      if (notificationType === NotificationType.DEVICE_CONNECTED && deviceId) {
        queryClient.setQueryData<Device[]>(adminKeys.devices(), (old) =>
          old?.map((d) =>
            d.deviceId === deviceId ? { ...d, isConnected: true } : d
          )
        )
      }

      if (notificationType === NotificationType.DEVICE_DISCONNECTED && deviceId) {
        queryClient.setQueryData<Device[]>(adminKeys.devices(), (old) =>
          old?.map((d) =>
            d.deviceId === deviceId ? { ...d, isConnected: false } : d
          )
        )
      }

      // 디바이스 삭제 시 캐시에서 제거
      if (notificationType === NotificationType.DEVICE_DELETED && deviceId) {
        queryClient.setQueryData<Device[]>(adminKeys.devices(), (old) =>
          old?.filter((d) => d.deviceId !== deviceId)
        )
      }
    },
    [queryClient]
  )

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isNew: false }))
    )
  }, [])

  const removeNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  // 테이블 WebSocket 메시지 처리 (delta only)
  const handleTableMessage = useCallback(
    (message: TableMessage) => {
      console.log("[WebSocket] Table delta received:", message)

      switch (message.type) {
        case TableMessageType.TABLE_ADDED:
          if (message.data) {
            const newTable = mapTableDataToTable(message.data)
            queryClient.setQueryData<Table[]>(tableKeys.list(), (old) => {
              if (!old) return [newTable]
              // 중복 방지: 이미 있으면 업데이트
              if (old.some((t) => t.tableId === newTable.tableId)) {
                return old.map((t) => t.tableId === newTable.tableId ? newTable : t)
              }
              return [...old, newTable]
            })
            console.log("[WebSocket] Table added:", newTable.tableId)
          }
          break

        case TableMessageType.TABLE_REMOVED:
          if (message.id) {
            queryClient.setQueryData<Table[]>(tableKeys.list(), (old) =>
              old?.filter((t) => t.tableId !== message.id)
            )
            console.log("[WebSocket] Table removed:", message.id)
          }
          break

        case TableMessageType.TABLE_UPDATED:
          if (message.data) {
            const updatedTable = mapTableDataToTable(message.data)
            queryClient.setQueryData<Table[]>(tableKeys.list(), (old) =>
              old?.map((t) =>
                t.tableId === updatedTable.tableId ? updatedTable : t
              )
            )
            console.log("[WebSocket] Table updated:", updatedTable.tableId)
          }
          break

      }
    },
    [queryClient]
  )

  // 테이블 리셋 메시지 발송 (개인 테이블 토픽으로)
  const publishTableReset = useCallback((tableId: string): boolean => {
    if (!clientRef.current?.connected) {
      console.warn("[WebSocket] Cannot publish table reset - not connected")
      return false
    }
    console.log("[WebSocket] Publishing table reset to:", tableId)
    return publishToTable(clientRef.current, tableId, {
      type: "TABLE_DELETED",
      data: { tableId, timestamp: new Date().toISOString() },
    })
  }, [])

  const connect = useCallback(() => {
    if (!accessToken) return

    // 기존 연결이 있으면 먼저 해제 (토큰 갱신 시 재연결을 위해)
    if (clientRef.current?.connected) {
      console.log("[WebSocket] Disconnecting existing connection for reconnect...")
      clientRef.current.deactivate()
      clientRef.current = null
    }

    console.log("[WebSocket] Attempting to connect...")
    console.log("[WebSocket] Token:", accessToken.substring(0, 20) + "...")

    const client = createStompClient({
      token: accessToken,
      debug: true, // 항상 디버그 모드
      onConnect: () => {
        console.log("[WebSocket] Connected successfully!")
        setConnectionStatus("connected")

        // Admin 전용 토픽 (디바이스 알림 등)
        if (isAdmin) {
          console.log("[WebSocket] Subscribing to:", ADMIN_TOPIC)
          client.subscribe(ADMIN_TOPIC, (message) => {
            console.log("[WebSocket] Admin notification received:", message.body)
            try {
              const notification = JSON.parse(message.body) as AdminNotification
              console.log("[WebSocket] Parsed notification:", notification)
              addNotification(notification)
            } catch (e) {
              console.error("[WebSocket] Failed to parse admin message:", message.body, e)
            }
          })
        }

        // 테이블 토픽 (Admin/Staff 공용)
        console.log("[WebSocket] Subscribing to:", TABLES_TOPIC)
        client.subscribe(TABLES_TOPIC, (message) => {
          console.log("[WebSocket] Table message received:", message.body)
          try {
            const tableMessage = JSON.parse(message.body) as TableMessage
            handleTableMessage(tableMessage)
          } catch (e) {
            console.error("[WebSocket] Failed to parse table message:", message.body, e)
          }
        })

        // 채팅 모니터 토픽 (Admin/Staff 공용)
        console.log("[WebSocket] Subscribing to:", STAFF_CHAT_MONITOR_TOPIC)
        client.subscribe(STAFF_CHAT_MONITOR_TOPIC, (message) => {
          console.log("[WebSocket] Chat monitor message received:", message.body)
          try {
            const parsed = JSON.parse(message.body) as ChatMonitorMessage
            // 모든 채팅 모니터 이벤트를 통합 이벤트로 dispatch
            window.dispatchEvent(
              new CustomEvent("chat-monitor-event", { detail: parsed })
            )
            // 하위호환: 제재 해제 이벤트도 기존 이벤트명으로 dispatch
            if (parsed.type === NotificationType.ROOM_SANCTION_LIFTED) {
              window.dispatchEvent(
                new CustomEvent("room-sanction-lifted", { detail: parsed })
              )
            }
          } catch (e) {
            console.error("[WebSocket] Failed to parse chat monitor message:", message.body, e)
          }
        })
      },
      onDisconnect: () => {
        console.log("[WebSocket] Disconnected")
        setConnectionStatus("disconnected")
      },
      onError: (error) => {
        console.error("[WebSocket] Error:", error)
        setConnectionStatus("error")
      },
    })

    clientRef.current = client
    setConnectionStatus("connecting")
    console.log("[WebSocket] Activating client...")
    client.activate()
  }, [accessToken, isAdmin, addNotification, handleTableMessage])

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      console.log("[WebSocket] Deactivating client...")
      clientRef.current.deactivate()
      clientRef.current = null
      setConnectionStatus("disconnected")
    }
  }, [])

  useEffect(() => {
    // 토큰이 변경되었는지 확인
    const tokenChanged = prevTokenRef.current !== undefined && prevTokenRef.current !== accessToken

    if (tokenChanged && accessToken) {
      console.log("[WebSocket] Token changed, reconnecting with new token...")
    }

    // 이전 토큰 저장
    prevTokenRef.current = accessToken

    if (status === "authenticated" && canConnect && !hasError && accessToken) {
      // 토큰이 변경되었거나 연결이 없으면 연결
      if (tokenChanged || !clientRef.current?.connected) {
        connect()
      }
    } else if (clientRef.current) {
      disconnect()
    }

    return () => {
      if (clientRef.current) {
        disconnect()
      }
    }
  }, [status, canConnect, hasError, accessToken, connect, disconnect])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isShaking,
        connectionStatus,
        markAllAsRead,
        removeNotification,
        clearAllNotifications,
        publishTableReset,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}
