"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  IconAlertTriangle,
  IconBan,
  IconGift,
  IconLoader2,
  IconMessageCircle,
  IconRefresh,
  IconSearch,
  IconShieldOff,
  IconVolume,
  IconVolumeOff,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  type ChatMessage,
  type ChatRoom,
  type SanctionType,
  fetchChatMessages,
  fetchChatRoom,
  fetchChatRooms,
  liftSanction,
  markChatAsRead,
  notifyDevice,
  sanctionChatRoom,
  toggleMute,
} from "@/lib/api/chat"
import { NotificationType, type ChatMonitorMessage } from "@/lib/websocket/types"
import { cn } from "@/lib/utils"
import { z } from "zod"

const sanctionSchema = z.object({
  type: z.enum(["WARNING", "MUTE", "BAN"]),
  reason: z.string().max(200, "사유는 200자 이내로 입력하세요").optional(),
})

function formatTime(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })
}

export default function ChatMonitorPage() {
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)
  const selectedRoomRef = useRef<ChatRoom | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [restrictDialogOpen, setRestrictDialogOpen] = useState(false)
  const [restrictType, setRestrictType] = useState<SanctionType>("WARNING")
  const [restrictReason, setRestrictReason] = useState("")
  const [restrictDuration, setRestrictDuration] = useState<string>("permanent")
  const [restrictCustomMinutes, setRestrictCustomMinutes] = useState("")
  const [restrictError, setRestrictError] = useState("")
  const [restrictMuteTargets, setRestrictMuteTargets] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [notifyDialogOpen, setNotifyDialogOpen] = useState(false)
  const [notifyTargetDeviceId, setNotifyTargetDeviceId] = useState("")
  const [notifyTitle, setNotifyTitle] = useState("")
  const [notifyMessage, setNotifyMessage] = useState("")
  const [alertMessage, setAlertMessage] = useState("")
  const [alertOpen, setAlertOpen] = useState(false)
  const [confirmLiftOpen, setConfirmLiftOpen] = useState(false)

  // 채팅방 목록 로드
  const loadRooms = useCallback(async () => {
    try {
      setLoading(true)
      const filterParam = filterType !== "all" ? filterType : undefined
      const data = await fetchChatRooms({
        search: searchQuery || undefined,
        filter: filterParam,
      })
      setRooms(data)
    } catch (err) {
      console.error("채팅방 목록 조회 실패:", err)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, filterType])

  useEffect(() => {
    loadRooms()
  }, [loadRooms])

  // ref를 항상 최신 selectedRoom과 동기화
  useEffect(() => {
    selectedRoomRef.current = selectedRoom
  }, [selectedRoom])

  // 메시지 변경 시 스크롤 하단으로
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // WebSocket 채팅 모니터 이벤트 수신 (실시간 동기화)
  // 의존성 없이 등록 1회 — ref로 최신 상태 참조하여 stale closure 방지
  useEffect(() => {
    const handler = (e: Event) => {
      const event = e as CustomEvent<ChatMonitorMessage>
      const data = event.detail
      const currentRoomId = selectedRoomRef.current?.id

      switch (data.type) {
        case NotificationType.CHAT_NEW_MESSAGE: {
          if (data.messageId) {
            setRooms((prev) =>
              prev.map((r) =>
                r.id === data.roomId
                  ? {
                      ...r,
                      totalMessageCount: r.totalMessageCount + 1,
                      giftCount:
                        data.messageType === "GIFT"
                          ? r.giftCount + 1
                          : r.giftCount,
                      unreadCount:
                        currentRoomId === data.roomId
                          ? r.unreadCount
                          : r.unreadCount + 1,
                    }
                  : r
              )
            )

            if (currentRoomId === data.roomId) {
              const newMsg: ChatMessage = {
                id: data.messageId,
                chatRoomId: data.roomId,
                senderDeviceId: data.senderDeviceId ?? "",
                senderTableName: data.senderTableName ?? "",
                content: data.content ?? "",
                type: (data.messageType ?? "MESSAGE") as ChatMessage["type"],
                createdAt: data.createdAt ?? new Date().toISOString(),
              }
              setMessages((prev) => {
                // 중복 방지
                if (prev.some((m) => m.id === newMsg.id)) return prev
                // id 기준 정렬 삽입
                const next = [...prev, newMsg]
                next.sort((a, b) => a.id - b.id)
                return next
              })
              markChatAsRead(data.roomId, data.messageId).catch(() => {})
            }
          }
          break
        }

        case NotificationType.CHAT_GIFT_SENT:
        case NotificationType.CHAT_GIFT_RECEIVED: {
          fetchChatRoom(data.roomId)
            .then((room) => {
              setRooms((prev) =>
                prev.map((r) => (r.id === room.id ? room : r))
              )
              if (selectedRoomRef.current?.id === room.id) {
                setSelectedRoom(room)
              }
            })
            .catch(() => {})
          break
        }

        case NotificationType.CHAT_ROOM_CREATED: {
          if (data.room) {
            setRooms((prev) => {
              if (prev.some((r) => r.id === data.room!.id)) return prev
              return [data.room as ChatRoom, ...prev]
            })
          }
          break
        }

        case NotificationType.CHAT_ROOM_CLOSED: {
          setRooms((prev) => prev.filter((r) => r.id !== data.roomId))
          if (currentRoomId === data.roomId) {
            setSelectedRoom(null)
            setMessages([])
          }
          break
        }

        case NotificationType.CHAT_ROOM_UPDATED: {
          if (data.room) {
            const updatedRoom = data.room as ChatRoom
            setRooms((prev) =>
              prev.map((r) => (r.id === updatedRoom.id ? updatedRoom : r))
            )
            if (currentRoomId === updatedRoom.id) {
              setSelectedRoom(updatedRoom)
            }
          } else {
            fetchChatRoom(data.roomId)
              .then((room) => {
                setRooms((prev) =>
                  prev.map((r) => (r.id === room.id ? room : r))
                )
                if (selectedRoomRef.current?.id === room.id) {
                  setSelectedRoom(room)
                }
              })
              .catch(() => {})
          }
          break
        }

        case NotificationType.ROOM_SANCTION_LIFTED: {
          fetchChatRoom(data.roomId)
            .then((room) => {
              setRooms((prev) =>
                prev.map((r) => (r.id === room.id ? room : r))
              )
              if (selectedRoomRef.current?.id === room.id) {
                setSelectedRoom(room)
              }
            })
            .catch(() => {})
          break
        }
      }
    }

    window.addEventListener("chat-monitor-event", handler)
    return () => window.removeEventListener("chat-monitor-event", handler)
  }, [])

  // 메시지 로드
  const loadMessages = useCallback(async (roomId: number) => {
    try {
      setMessagesLoading(true)
      // 먼저 총 페이지 수를 확인하고, 마지막 페이지(최신 메시지)를 로드
      const firstFetch = await fetchChatMessages(roomId, { size: 50 })
      let data = firstFetch
      if (firstFetch.totalPages > 1) {
        data = await fetchChatMessages(roomId, { page: firstFetch.totalPages - 1, size: 50 })
      }
      // 기존 WS 메시지와 병합 (중복 제거 + 정렬)
      const fetched = data.content || []
      setMessages((prev) => {
        const merged = new Map<number, ChatMessage>()
        // API 데이터 먼저
        for (const m of fetched) merged.set(m.id, m)
        // 기존 WS 메시지 중 API 범위 이후 것만 추가
        const maxFetchedId = fetched.length > 0 ? Math.max(...fetched.map((m) => m.id)) : 0
        for (const m of prev) {
          if (m.id > maxFetchedId) merged.set(m.id, m)
        }
        return Array.from(merged.values()).sort((a, b) => a.id - b.id)
      })
      // 마지막 메시지 읽음 처리 후 목록 갱신
      if (fetched.length > 0) {
        const maxMessageId = Math.max(...fetched.map((m) => m.id))
        markChatAsRead(roomId, maxMessageId)
          .then(() => {
            // 읽음 처리 성공 시 rooms 목록 갱신하여 unreadCount 반영
            setRooms((prev) =>
              prev.map((r) => (r.id === roomId ? { ...r, unreadCount: 0 } : r))
            )
            setSelectedRoom((prev) =>
              prev?.id === roomId ? { ...prev, unreadCount: 0 } : prev
            )
          })
          .catch(() => {})
      }
    } catch (err) {
      console.error("메시지 조회 실패:", err)
      setMessages([])
    } finally {
      setMessagesLoading(false)
    }
  }, [])

  // 채팅방 선택
  const handleSelectRoom = (room: ChatRoom) => {
    setSelectedRoom(room)
    loadMessages(room.id)
  }

  // 제재 적용
  const handleRestrict = async () => {
    if (!selectedRoom) return
    const parsed = sanctionSchema.safeParse({
      type: restrictType,
      reason: restrictReason || undefined,
    })
    if (!parsed.success) {
      setRestrictError(parsed.error.issues[0].message)
      return
    }
    try {
      setRestrictError("")

      // MUTE 유형은 개별 참여자 음소거 (toggleMute)
      if (restrictType === "MUTE") {
        if (restrictMuteTargets.length === 0) {
          setRestrictError("음소거할 테이블을 선택하세요")
          return
        }
        await Promise.all(
          restrictMuteTargets.map((deviceId) =>
            toggleMute(selectedRoom.id, deviceId)
          )
        )
      } else {
        // WARNING, BAN은 방 전체 제재
        let durationMinutes: number | undefined
        if (restrictType === "BAN") {
          if (restrictDuration === "custom") {
            const mins = parseInt(restrictCustomMinutes, 10)
            if (!mins || mins <= 0) {
              setRestrictError("유효한 시간(분)을 입력하세요")
              return
            }
            durationMinutes = mins
          } else if (restrictDuration !== "permanent") {
            durationMinutes = parseInt(restrictDuration, 10)
          }
        }
        await sanctionChatRoom(selectedRoom.id, { ...parsed.data, durationMinutes })
      }

      setRestrictDialogOpen(false)
      setRestrictReason("")
      setRestrictDuration("permanent")
      setRestrictCustomMinutes("")
      setRestrictMuteTargets([])
      setSelectedRoom(null)
      setMessages([])
      loadRooms()
    } catch (err) {
      console.error("제재 적용 실패:", err)
      setAlertMessage("제재 적용에 실패했습니다.")
      setAlertOpen(true)
    }
  }

  // 제재 해제
  const handleLiftSanction = () => {
    if (!selectedRoom) return
    setConfirmLiftOpen(true)
  }

  const handleConfirmLift = async () => {
    if (!selectedRoom) return
    try {
      await liftSanction(selectedRoom.id)
      setSelectedRoom(null)
      setMessages([])
      loadRooms()
    } catch (err) {
      console.error("제재 해제 실패:", err)
      setAlertMessage("제재 해제에 실패했습니다.")
      setAlertOpen(true)
    } finally {
      setConfirmLiftOpen(false)
    }
  }

  // 음소거 토글
  const handleToggleMute = async (roomId: number, deviceId: string) => {
    try {
      const result = await toggleMute(roomId, deviceId)
      const isMutedNow = result[deviceId]

      // 음소거 시 해당 디바이스에 알림 자동 전송
      if (isMutedNow) {
        notifyDevice(deviceId, {
          title: "채팅 음소거",
          message: "스태프에 의해 채팅이 음소거되었습니다. 메시지를 보낼 수 없습니다.",
        }).catch(() => {})
      }

      // participants의 isMuted 상태를 즉시 반영
      const updateParticipants = (room: ChatRoom): ChatRoom => ({
        ...room,
        participants: room.participants.map((p) =>
          p.deviceId === deviceId ? { ...p, isMuted: isMutedNow } : p
        ),
      })

      setRooms((prev) =>
        prev.map((r) => (r.id === roomId ? updateParticipants(r) : r))
      )
      if (selectedRoom?.id === roomId) {
        setSelectedRoom((prev) => (prev ? updateParticipants(prev) : prev))
      }
    } catch (err) {
      console.error("음소거 실패:", err)
    }
  }

  // 알림 전송
  const handleNotify = async () => {
    if (!notifyTargetDeviceId) return
    try {
      await notifyDevice(notifyTargetDeviceId, {
        title: notifyTitle || "스태프 알림",
        message: notifyMessage,
      })
      setNotifyDialogOpen(false)
      setNotifyTitle("")
      setNotifyMessage("")
    } catch (err) {
      console.error("알림 전송 실패:", err)
      setAlertMessage("알림 전송에 실패했습니다.")
      setAlertOpen(true)
    }
  }

  const tableNames = (room: ChatRoom) =>
    room.participants.map((p) => p.tableName).join(" ↔ ")

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <div className="grid gap-4 lg:grid-cols-4">
          {/* 채팅방 목록 */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">활성 채팅</CardTitle>
                <Button variant="ghost" size="icon" onClick={loadRooms}>
                  <IconRefresh className="size-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <IconSearch className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    placeholder="테이블 검색"
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 ({rooms.length})</SelectItem>
                  <SelectItem value="unread">
                    읽지않음 ({rooms.filter((r) => r.unreadCount > 0).length})
                  </SelectItem>
                  <SelectItem value="warning">
                    주의 ({rooms.filter((r) => r.reportCount > 0).length})
                  </SelectItem>
                  <SelectItem value="sanctioned">
                    제재됨 ({rooms.filter((r) => r.status === "SANCTIONED").length})
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[450px]">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <IconLoader2 className="size-5 animate-spin text-muted-foreground" />
                  </div>
                ) : rooms.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    활성 채팅방이 없습니다
                  </div>
                ) : (
                  rooms.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => handleSelectRoom(room)}
                      className={cn(
                        "w-full p-3 text-left hover:bg-accent transition-colors border-b",
                        selectedRoom?.id === room.id && "bg-accent"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <IconMessageCircle className="size-4 text-green-600" />
                          <span className="font-medium text-sm">
                            {tableNames(room)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {room.reportCount > 0 && (
                            <IconAlertTriangle className="size-4 text-amber-500" />
                          )}
                          {room.unreadCount > 0 && (
                            <Badge
                              variant="destructive"
                              className="size-5 p-0 justify-center text-xs"
                            >
                              {room.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatTime(room.startedAt)}</span>
                        <span>·</span>
                        <span>{room.totalMessageCount}건</span>
                        {room.giftCount > 0 && (
                          <>
                            <span>·</span>
                            <span className="text-pink-500">
                              🎁{room.giftCount}
                            </span>
                          </>
                        )}
                        {room.status === "SANCTIONED" && (
                          <>
                            <span>·</span>
                            <Badge variant="destructive" className="text-xs h-4">
                              제재됨
                            </Badge>
                          </>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* 채팅 내용 */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              {selectedRoom ? (
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {tableNames(selectedRoom)}
                    </CardTitle>
                    <CardDescription>실시간 채팅 모니터링</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {selectedRoom.status === "SANCTIONED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLiftSanction}
                      >
                        <IconShieldOff className="size-4 mr-1" />
                        제재 해제
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive"
                      onClick={() => setRestrictDialogOpen(true)}
                    >
                      <IconBan className="size-4 mr-1" />
                      제재
                    </Button>
                  </div>
                </div>
              ) : (
                <CardTitle className="text-base">채팅방을 선택하세요</CardTitle>
              )}
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
              <ScrollArea className="h-[450px] p-4">
                {selectedRoom ? (
                  messagesLoading ? (
                    <div className="h-full flex items-center justify-center">
                      <IconLoader2 className="size-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                      메시지가 없습니다
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((msg) => {
                        const msgType = msg.type?.toUpperCase()
                        const isFirst =
                          msg.senderTableName ===
                          selectedRoom.participants[0]?.tableName
                        const isSystem =
                          msgType === "SYSTEM" ||
                          msgType === "JOIN" ||
                          msgType === "LEAVE"
                        const isGift = msgType === "GIFT"

                        if (isSystem) {
                          return (
                            <div
                              key={msg.id}
                              className="text-center text-xs text-muted-foreground py-1"
                            >
                              {msg.content}
                            </div>
                          )
                        }

                        return (
                          <div
                            key={msg.id}
                            className={cn(
                              "flex flex-col max-w-[75%]",
                              isFirst
                                ? "items-start"
                                : "items-end ml-auto"
                            )}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {msg.senderTableName}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatTime(msg.createdAt)}
                              </span>
                            </div>
                            <div
                              className={cn(
                                "rounded-lg px-3 py-2 text-sm",
                                isGift
                                  ? "bg-pink-500/10 border border-pink-500/30"
                                  : isFirst
                                    ? "bg-muted"
                                    : "bg-primary text-primary-foreground"
                              )}
                            >
                              {isGift && (
                                <IconGift className="inline size-4 mr-1 text-pink-500" />
                              )}
                              {msg.content}
                            </div>
                          </div>
                        )
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    왼쪽에서 모니터링할 채팅방을 선택하세요
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* 테이블 정보 */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">테이블 정보</CardTitle>
              <CardDescription>채팅 참여 테이블</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedRoom ? (
                <div className="space-y-4">
                  {selectedRoom.participants.map((participant) => (
                    <div
                      key={participant.deviceId}
                      className="rounded-lg border p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">
                          테이블 {participant.tableName}
                        </span>
                        {participant.isMuted && (
                          <Badge variant="secondary" className="text-xs">
                            <IconVolumeOff className="size-3 mr-1" />
                            음소거
                          </Badge>
                        )}
                      </div>
                      <div className="mt-2 flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-8 text-xs"
                          disabled={participant.isMuted}
                          onClick={() => {
                            setNotifyTargetDeviceId(participant.deviceId)
                            setNotifyDialogOpen(true)
                          }}
                        >
                          <IconVolume className="size-3 mr-1" />
                          알림
                        </Button>
                        <Button
                          size="sm"
                          variant={participant.isMuted ? "default" : "outline"}
                          className="flex-1 h-8 text-xs"
                          onClick={() =>
                            handleToggleMute(
                              selectedRoom.id,
                              participant.deviceId
                            )
                          }
                        >
                          <IconVolumeOff className="size-3 mr-1" />
                          {participant.isMuted ? "해제" : "음소거"}
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Separator />

                  {/* 채팅 통계 */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">총 메시지</span>
                      <span className="font-medium">
                        {selectedRoom.totalMessageCount}건
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">선물 횟수</span>
                      <span className="font-medium">
                        {selectedRoom.giftCount}건
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">신고 횟수</span>
                      <span className="font-medium">
                        {selectedRoom.reportCount}건
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">시작 시간</span>
                      <span className="font-medium">
                        {formatTime(selectedRoom.startedAt)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">상태</span>
                      <Badge
                        variant={
                          selectedRoom.status === "ACTIVE"
                            ? "default"
                            : selectedRoom.status === "SANCTIONED"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {selectedRoom.status === "ACTIVE"
                          ? "활성"
                          : selectedRoom.status === "SANCTIONED"
                            ? "제재됨"
                            : "종료"}
                      </Badge>
                    </div>
                  </div>

                  {/* 제재 상세 정보 */}
                  {selectedRoom.status === "SANCTIONED" && selectedRoom.sanctionType && (
                    <>
                      <Separator />
                      <div className="space-y-2 text-sm">
                        <p className="font-medium text-destructive">제재 정보</p>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">유형</span>
                          <span className="font-medium">
                            {selectedRoom.sanctionType === "WARNING"
                              ? "경고"
                              : selectedRoom.sanctionType === "MUTE"
                                ? "음소거"
                                : "채팅 금지"}
                          </span>
                        </div>
                        {selectedRoom.sanctionReason && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">사유</span>
                            <span className="font-medium text-right max-w-[60%]">
                              {selectedRoom.sanctionReason}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">만료</span>
                          <span className="font-medium">
                            {selectedRoom.sanctionExpiresAt
                              ? formatTime(selectedRoom.sanctionExpiresAt)
                              : "영구"}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  채팅방을 선택하면 테이블 정보가 표시됩니다
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 제재 다이얼로그 */}
      <Dialog open={restrictDialogOpen} onOpenChange={setRestrictDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>채팅 제재</DialogTitle>
            <DialogDescription>
              {selectedRoom && tableNames(selectedRoom)} 채팅방에 제재를
              적용합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>제재 유형</Label>
              <Select value={restrictType} onValueChange={(v) => setRestrictType(v as SanctionType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WARNING">경고 메시지 전송</SelectItem>
                  <SelectItem value="MUTE">채팅 음소거</SelectItem>
                  <SelectItem value="BAN">채팅 금지</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {restrictType === "MUTE" && selectedRoom && (
              <div className="space-y-2">
                <Label>음소거 대상 테이블</Label>
                <div className="space-y-2">
                  {selectedRoom.participants.map((p) => (
                    <label
                      key={p.deviceId}
                      className={cn(
                        "flex items-center gap-2 rounded-md border p-2 cursor-pointer transition-colors",
                        restrictMuteTargets.includes(p.deviceId)
                          ? "border-primary bg-primary/5"
                          : "hover:bg-accent"
                      )}
                    >
                      <input
                        type="checkbox"
                        className="accent-primary"
                        checked={restrictMuteTargets.includes(p.deviceId)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRestrictMuteTargets((prev) => [...prev, p.deviceId])
                          } else {
                            setRestrictMuteTargets((prev) => prev.filter((id) => id !== p.deviceId))
                          }
                        }}
                      />
                      <span className="text-sm font-medium">{p.tableName}</span>
                      {p.isMuted && (
                        <Badge variant="secondary" className="text-[10px] h-4 ml-auto">
                          이미 음소거
                        </Badge>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}
            {restrictType === "BAN" && (
              <div className="space-y-2">
                <Label>기간</Label>
                <Select value={restrictDuration} onValueChange={setRestrictDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5분</SelectItem>
                    <SelectItem value="10">10분</SelectItem>
                    <SelectItem value="30">30분</SelectItem>
                    <SelectItem value="60">1시간</SelectItem>
                    <SelectItem value="permanent">영구</SelectItem>
                    <SelectItem value="custom">직접 입력</SelectItem>
                  </SelectContent>
                </Select>
                {restrictDuration === "custom" && (
                  <Input
                    type="number"
                    placeholder="분 단위로 입력"
                    value={restrictCustomMinutes}
                    onChange={(e) => setRestrictCustomMinutes(e.target.value)}
                    min={1}
                  />
                )}
              </div>
            )}
            {restrictType !== "MUTE" && (
              <div className="space-y-2">
                <Label>사유 (선택)</Label>
                <Input
                  placeholder="제재 사유를 입력하세요"
                  value={restrictReason}
                  onChange={(e) => setRestrictReason(e.target.value)}
                  maxLength={200}
                />
              </div>
            )}
            {restrictError && (
              <p className="text-xs text-destructive">{restrictError}</p>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setRestrictDialogOpen(false)}
              >
                취소
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleRestrict}
              >
                적용
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 에러 알림 다이얼로그 */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>오류</AlertDialogTitle>
            <AlertDialogDescription>{alertMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAlertOpen(false)}>
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 제재 해제 확인 다이얼로그 */}
      <AlertDialog open={confirmLiftOpen} onOpenChange={setConfirmLiftOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>제재 해제</AlertDialogTitle>
            <AlertDialogDescription>
              정말 제재를 해제하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmLift}>
              해제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 알림 전송 다이얼로그 */}
      <Dialog open={notifyDialogOpen} onOpenChange={setNotifyDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>알림 전송</DialogTitle>
            <DialogDescription>
              디바이스에 알림을 전송합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>제목</Label>
              <Input
                placeholder="알림 제목"
                value={notifyTitle}
                onChange={(e) => setNotifyTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>내용</Label>
              <Input
                placeholder="알림 내용을 입력하세요"
                value={notifyMessage}
                onChange={(e) => setNotifyMessage(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setNotifyDialogOpen(false)}
              >
                취소
              </Button>
              <Button className="flex-1" onClick={handleNotify}>
                전송
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
