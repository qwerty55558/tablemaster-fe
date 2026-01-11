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
import { createStompClient, ADMIN_TOPIC } from "@/lib/websocket/stomp-client"
import {
  NotificationType,
  type AdminNotification,
  type Activity,
  type WebSocketConnectionStatus,
} from "@/lib/websocket/types"
import { adminKeys } from "@/hooks/use-admin"
import type { PendingDevice } from "@/lib/api/admin"

interface NotificationContextValue {
  notifications: Activity[]
  unreadCount: number
  isShaking: boolean
  connectionStatus: WebSocketConnectionStatus
  markAllAsRead: () => void
  removeNotification: (id: number) => void
  clearAllNotifications: () => void
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
    }
  }
  return context
}

let notificationIdCounter = 1

function formatTimeAgo(): string {
  return "방금 전"
}

function getDefaultMessage(type: NotificationType, data?: Record<string, unknown>): string {
  switch (type) {
    case NotificationType.DEVICE_REGISTER_REQUEST:
      const deviceId = data?.deviceId as string
      return deviceId
        ? `새로운 디바이스 등록 요청: ${deviceId.substring(0, 8)}...`
        : "새로운 디바이스 등록 요청이 있습니다"
    case NotificationType.SYSTEM_ALERT:
      return "시스템 알림"
    default:
      return "새로운 알림"
  }
}

function mapNotificationToActivity(notification: AdminNotification): Activity {
  const typeMap: Record<NotificationType, Activity["type"]> = {
    [NotificationType.DEVICE_REGISTER_REQUEST]: "device",
    [NotificationType.SYSTEM_ALERT]: "warning",
  }

  // 메시지가 없으면 기본 메시지 생성
  const message = notification.message || getDefaultMessage(notification.type, notification.data)

  return {
    id: notificationIdCounter++,
    type: typeMap[notification.type] || "warning",
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

  const [notifications, setNotifications] = useState<Activity[]>([])
  const [connectionStatus, setConnectionStatus] =
    useState<WebSocketConnectionStatus>("disconnected")
  const [isShaking, setIsShaking] = useState(false)

  const isAdmin = session?.user?.roles?.includes("ROLE_ADMIN") ?? false
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

      // 디바이스 등록 요청이면 캐시에 직접 추가 (API 호출 없이 실시간 반영)
      if (notification.type === NotificationType.DEVICE_REGISTER_REQUEST && notification.data) {
        const deviceId = notification.data.deviceId as string
        const newPendingDevice: PendingDevice = {
          deviceId,
          requestedAt: new Date().toISOString(),
          ttl: 180, // 3분
        }

        queryClient.setQueryData<PendingDevice[]>(
          adminKeys.pendingDevices(),
          (old) => {
            if (!old) return [newPendingDevice]
            // 중복 방지
            if (old.some((d) => d.deviceId === deviceId)) return old
            return [newPendingDevice, ...old]
          }
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

  const connect = useCallback(() => {
    if (!accessToken || clientRef.current?.connected) return

    console.log("[WebSocket] Attempting to connect...")
    console.log("[WebSocket] Token:", accessToken.substring(0, 20) + "...")

    const client = createStompClient({
      token: accessToken,
      debug: true, // 항상 디버그 모드
      onConnect: () => {
        console.log("[WebSocket] Connected successfully!")
        console.log("[WebSocket] Subscribing to:", ADMIN_TOPIC)
        setConnectionStatus("connected")
        client.subscribe(ADMIN_TOPIC, (message) => {
          console.log("[WebSocket] Raw message received:", message)
          console.log("[WebSocket] Message body:", message.body)
          try {
            const notification = JSON.parse(
              message.body
            ) as AdminNotification
            console.log("[WebSocket] Parsed notification:", notification)
            addNotification(notification)
          } catch (e) {
            console.error("[WebSocket] Failed to parse message:", message.body, e)
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
  }, [accessToken, addNotification])

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      console.log("[WebSocket] Deactivating client...")
      clientRef.current.deactivate()
      clientRef.current = null
      setConnectionStatus("disconnected")
    }
  }, [])

  useEffect(() => {
    if (status === "authenticated" && isAdmin && !hasError && accessToken) {
      connect()
    } else if (clientRef.current) {
      disconnect()
    }

    return () => {
      if (clientRef.current) {
        disconnect()
      }
    }
  }, [status, isAdmin, hasError, accessToken, connect, disconnect])

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
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}
