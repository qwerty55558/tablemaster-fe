import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs"

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://127.0.0.1:8080/ws"

export interface StompClientOptions {
  token: string
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: string) => void
  debug?: boolean
}

export function createStompClient(options: StompClientOptions): Client {
  const { token, onConnect, onDisconnect, onError, debug = false } = options

  const client = new Client({
    brokerURL: WS_URL,
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
    reconnectDelay: 2000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    debug: debug
      ? (str) => {
          console.log("[STOMP]", str)
        }
      : () => {},
    onConnect: () => {
      onConnect?.()
    },
    onDisconnect: () => {
      onDisconnect?.()
    },
    onStompError: (frame) => {
      const errorMessage = frame.headers["message"] || "Unknown STOMP error"
      onError?.(errorMessage)
    },
    onWebSocketError: () => {
      onError?.("WebSocket connection failed")
    },
  })

  return client
}

export function subscribeToTopic(
  client: Client,
  topic: string,
  callback: (message: IMessage) => void
): StompSubscription | null {
  if (!client.connected) {
    return null
  }
  return client.subscribe(topic, callback)
}

/**
 * STOMP 메시지 발송
 */
export function publishMessage(
  client: Client,
  destination: string,
  body: object
): boolean {
  if (!client.connected) {
    console.warn("[STOMP] Cannot publish - client not connected")
    return false
  }
  client.publish({
    destination,
    body: JSON.stringify(body),
  })
  return true
}

/**
 * 특정 테이블에 메시지 발송
 */
export function publishToTable(
  client: Client,
  tableId: string,
  message: { type: string; data?: Record<string, unknown> }
): boolean {
  const destination = `/topic/table/${tableId}`
  return publishMessage(client, destination, message)
}

export const ADMIN_TOPIC = "/topic/role.ADMIN"
export const TABLES_TOPIC = "/topic/tables"
