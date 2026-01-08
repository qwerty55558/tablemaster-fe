"use client"

import { useState } from "react"
import {
  IconAlertTriangle,
  IconBan,
  IconGift,
  IconMessageCircle,
  IconPhoto,
  IconRefresh,
  IconSearch,
  IconUsers,
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
import { cn } from "@/lib/utils"

// 더미 채팅방 목록
const chatRooms = [
  { 
    id: 1, 
    tables: ["A1", "B1"], 
    tableInfo: { A1: { guests: 4, region: "서울" }, B1: { guests: 6, region: "서울" } },
    lastMessage: "안녕하세요! 저쪽 테이블이신가요?",
    timestamp: "21:05",
    unread: 3,
    hasWarning: false,
    messageCount: 24,
    giftCount: 2,
  },
  { 
    id: 2, 
    tables: ["A2", "C1"], 
    tableInfo: { A2: { guests: 3, region: "부산" }, C1: { guests: 5, region: "대구" } },
    lastMessage: "네 반갑습니다 ㅎㅎ",
    timestamp: "21:03",
    unread: 0,
    hasWarning: false,
    messageCount: 12,
    giftCount: 0,
  },
  { 
    id: 3, 
    tables: ["B2", "C3"], 
    tableInfo: { B2: { guests: 2, region: "인천" }, C3: { guests: 4, region: "광주" } },
    lastMessage: "혹시 연락처 알 수 있을까요?",
    timestamp: "21:00",
    unread: 1,
    hasWarning: true,
    messageCount: 18,
    giftCount: 1,
  },
  { 
    id: 4, 
    tables: ["A1", "D1"], 
    tableInfo: { A1: { guests: 4, region: "서울" }, D1: { guests: 3, region: "경기" } },
    lastMessage: "오늘 분위기 좋네요!",
    timestamp: "20:55",
    unread: 0,
    hasWarning: false,
    messageCount: 8,
    giftCount: 0,
  },
]

type ChatRoom = typeof chatRooms[0]

// 선택된 채팅방의 메시지
const chatMessages = [
  { id: 1, sender: "A1", message: "안녕하세요!", timestamp: "20:50", type: "text" },
  { id: 2, sender: "B1", message: "안녕하세요~ 반갑습니다", timestamp: "20:51", type: "text" },
  { id: 3, sender: "A1", message: "저희 4명인데 혹시 어디서 오셨어요?", timestamp: "20:52", type: "text" },
  { id: 4, sender: "B1", message: "서울에서 왔어요! 거기는요?", timestamp: "20:53", type: "text" },
  { id: 5, sender: "A1", message: "저희도 서울이에요 ㅎㅎ", timestamp: "20:54", type: "text" },
  { id: 6, sender: "B1", message: "오 신기하네요! 뭐 드시고 계세요?", timestamp: "20:55", type: "text" },
  { id: 7, sender: "A1", message: "저희 와인 마시고 있어요~", timestamp: "20:58", type: "text" },
  { id: 8, sender: "A1", message: "🍷 레드와인 1병 선물", timestamp: "21:00", type: "gift" },
  { id: 9, sender: "B1", message: "헉 감사합니다!! 🍷", timestamp: "21:02", type: "text" },
  { id: 10, sender: "A1", message: "사진.jpg", timestamp: "21:04", type: "image" },
  { id: 11, sender: "B1", message: "안녕하세요! 저쪽 테이블이신가요?", timestamp: "21:05", type: "text" },
]

export default function ChatMonitorPage() {
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(chatRooms[0])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [restrictDialogOpen, setRestrictDialogOpen] = useState(false)
  const [restrictType, setRestrictType] = useState<string>("warning")

  const filteredRooms = chatRooms.filter((room) => {
    const matchesSearch = room.tables.some(t => 
      t.toLowerCase().includes(searchQuery.toLowerCase())
    )
    const matchesFilter = filterType === "all" || 
      (filterType === "warning" && room.hasWarning) ||
      (filterType === "unread" && room.unread > 0)
    return matchesSearch && matchesFilter
  })

  const handleRestrict = () => {
    alert(`${selectedRoom?.tables.join(" ↔ ")} 채팅방에 ${restrictType === "warning" ? "경고" : restrictType === "mute" ? "채팅 제한" : "채팅 금지"}를 적용했습니다.`)
    setRestrictDialogOpen(false)
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <div className="grid gap-4 lg:grid-cols-4">
          {/* 채팅방 목록 */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">활성 채팅</CardTitle>
                <Button variant="ghost" size="icon">
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
                  <SelectItem value="all">전체 ({chatRooms.length})</SelectItem>
                  <SelectItem value="unread">읽지않음 ({chatRooms.filter(r => r.unread > 0).length})</SelectItem>
                  <SelectItem value="warning">주의 ({chatRooms.filter(r => r.hasWarning).length})</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[450px]">
                {filteredRooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoom(room)}
                    className={cn(
                      "w-full p-3 text-left hover:bg-accent transition-colors border-b",
                      selectedRoom?.id === room.id && "bg-accent"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <IconMessageCircle className="size-4 text-green-600" />
                        <span className="font-medium text-sm">
                          {room.tables.join(" ↔ ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {room.hasWarning && (
                          <IconAlertTriangle className="size-4 text-amber-500" />
                        )}
                        {room.unread > 0 && (
                          <Badge variant="destructive" className="size-5 p-0 justify-center text-xs">
                            {room.unread}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground truncate">
                      {room.lastMessage}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{room.timestamp}</span>
                      <span>·</span>
                      <span>{room.messageCount}건</span>
                      {room.giftCount > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-pink-500">🎁{room.giftCount}</span>
                        </>
                      )}
                    </div>
                  </button>
                ))}
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
                      {selectedRoom.tables.join(" ↔ ")}
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
                  <div className="space-y-3">
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex flex-col max-w-[75%]",
                          msg.sender === selectedRoom.tables[0] ? "items-start" : "items-end ml-auto"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {msg.sender}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {msg.timestamp}
                          </span>
                        </div>
                        <div
                          className={cn(
                            "rounded-lg px-3 py-2 text-sm",
                            msg.type === "gift" && "bg-pink-500/10 border border-pink-500/30",
                            msg.type === "image" && "bg-blue-500/10 border border-blue-500/30",
                            msg.type === "text" && (
                              msg.sender === selectedRoom.tables[0]
                                ? "bg-muted"
                                : "bg-primary text-primary-foreground"
                            )
                          )}
                        >
                          {msg.type === "gift" && <IconGift className="inline size-4 mr-1 text-pink-500" />}
                          {msg.type === "image" && <IconPhoto className="inline size-4 mr-1 text-blue-500" />}
                          {msg.message}
                        </div>
                      </div>
                    ))}
                  </div>
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
                  {selectedRoom.tables.map((table) => {
                    const info = selectedRoom.tableInfo[table as keyof typeof selectedRoom.tableInfo]
                    if (!info) return null
                    return (
                      <div key={table} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">테이블 {table}</span>
                          <Badge variant="secondary">
                            <IconUsers className="size-3 mr-1" />
                            {info.guests}명
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          지역: {info.region}
                        </p>
                        <div className="mt-2 flex gap-1">
                          <Button size="sm" variant="outline" className="flex-1 h-8 text-xs">
                            <IconVolume className="size-3 mr-1" />
                            알림
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 h-8 text-xs">
                            <IconVolumeOff className="size-3 mr-1" />
                            음소거
                          </Button>
                        </div>
                      </div>
                    )
                  })}

                  <Separator />

                  {/* 채팅 통계 */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">총 메시지</span>
                      <span className="font-medium">{selectedRoom.messageCount}건</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">선물 횟수</span>
                      <span className="font-medium">{selectedRoom.giftCount}건</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">시작 시간</span>
                      <span className="font-medium">20:50</span>
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
              {selectedRoom?.tables.join(" ↔ ")} 채팅방에 제재를 적용합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>제재 유형</Label>
              <Select value={restrictType} onValueChange={setRestrictType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="warning">경고 메시지 전송</SelectItem>
                  <SelectItem value="mute">10분간 채팅 제한</SelectItem>
                  <SelectItem value="ban">채팅 금지</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>사유 (선택)</Label>
              <Input placeholder="제재 사유를 입력하세요" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setRestrictDialogOpen(false)}>
                취소
              </Button>
              <Button variant="destructive" className="flex-1" onClick={handleRestrict}>
                적용
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
