"use client"

import { useCallback, useEffect, useState } from "react"
import {
  IconAlertTriangle,
  IconBan,
  IconGift,
  IconLoader2,
  IconMessageCircle,
  IconRefresh,
  IconSearch,
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
  fetchChatRooms,
  markChatAsRead,
  notifyDevice,
  sanctionChatRoom,
  toggleMute,
} from "@/lib/api/chat"
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
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [restrictDialogOpen, setRestrictDialogOpen] = useState(false)
  const [restrictType, setRestrictType] = useState<SanctionType>("WARNING")
  const [restrictReason, setRestrictReason] = useState("")
  const [restrictError, setRestrictError] = useState("")
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [notifyDialogOpen, setNotifyDialogOpen] = useState(false)
  const [notifyTargetDeviceId, setNotifyTargetDeviceId] = useState("")
  const [notifyTitle, setNotifyTitle] = useState("")
  const [notifyMessage, setNotifyMessage] = useState("")

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
      setMessages(data.content || [])
      // 마지막 메시지 읽음 처리 후 목록 갱신
      if (data.content && data.content.length > 0) {
        const maxMessageId = Math.max(...data.content.map((m) => m.id))
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
      await sanctionChatRoom(selectedRoom.id, parsed.data)
      setRestrictDialogOpen(false)
      setRestrictReason("")
      setSelectedRoom(null)
      setMessages([])
      loadRooms()
    } catch (err) {
      console.error("제재 적용 실패:", err)
      alert("제재 적용에 실패했습니다.")
    }
  }

  // 음소거 토글
  const handleToggleMute = async (roomId: number, deviceId: string) => {
    try {
      const result = await toggleMute(roomId, deviceId)
      const isMutedNow = result?.[deviceId] ?? true

      // 음소거 시 해당 디바이스에 알림 자동 전송
      if (isMutedNow) {
        notifyDevice(deviceId, {
          title: "채팅 음소거",
          message: "스태프에 의해 채팅이 음소거되었습니다. 메시지를 보낼 수 없습니다.",
        }).catch(() => {})
      }

      // 선택된 방 정보 갱신
      loadRooms()
      if (selectedRoom?.id === roomId) {
        loadMessages(roomId)
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
      alert("알림 전송에 실패했습니다.")
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
                        const isFirst =
                          msg.senderTableName ===
                          selectedRoom.participants[0]?.tableName
                        const isSystem =
                          msg.type === "SYSTEM" ||
                          msg.type === "JOIN" ||
                          msg.type === "LEAVE"

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
                                msg.type === "GIFT" &&
                                  "bg-pink-500/10 border border-pink-500/30",
                                msg.type === "MESSAGE" &&
                                  (isFirst
                                    ? "bg-muted"
                                    : "bg-primary text-primary-foreground")
                              )}
                            >
                              {msg.type === "GIFT" && (
                                <IconGift className="inline size-4 mr-1 text-pink-500" />
                              )}
                              {msg.content}
                            </div>
                          </div>
                        )
                      })}
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
            <div className="space-y-2">
              <Label>사유 (선택)</Label>
              <Input
                placeholder="제재 사유를 입력하세요"
                value={restrictReason}
                onChange={(e) => setRestrictReason(e.target.value)}
                maxLength={200}
              />
              {restrictError && (
                <p className="text-xs text-destructive">{restrictError}</p>
              )}
            </div>
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
