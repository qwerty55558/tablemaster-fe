"use client"

import { useState } from "react"
import {
  IconFilter,
  IconMessageCircle,
  IconMessageOff,
  IconSearch,
  IconUsers,
  IconUserMinus,
  IconGift,
  IconBan,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

// 더미 데이터
const tablesData = [
  { id: 1, name: "A1", status: "active", guests: 4, male: 2, female: 2, region: "서울", chatEnabled: true, entryTime: "19:30", spent: 125000 },
  { id: 2, name: "A2", status: "active", guests: 3, male: 1, female: 2, region: "부산", chatEnabled: true, entryTime: "19:45", spent: 89000 },
  { id: 3, name: "A3", status: "empty", guests: 0, male: 0, female: 0, region: "", chatEnabled: false, entryTime: "", spent: 0 },
  { id: 4, name: "B1", status: "active", guests: 6, male: 3, female: 3, region: "서울", chatEnabled: true, entryTime: "20:00", spent: 230000 },
  { id: 5, name: "B2", status: "active", guests: 2, male: 1, female: 1, region: "인천", chatEnabled: false, entryTime: "20:15", spent: 56000 },
  { id: 6, name: "B3", status: "empty", guests: 0, male: 0, female: 0, region: "", chatEnabled: false, entryTime: "", spent: 0 },
  { id: 7, name: "C1", status: "active", guests: 5, male: 2, female: 3, region: "대구", chatEnabled: true, entryTime: "20:30", spent: 178000 },
  { id: 8, name: "C2", status: "reserved", guests: 0, male: 0, female: 0, region: "", chatEnabled: false, entryTime: "", spent: 0 },
  { id: 9, name: "C3", status: "active", guests: 4, male: 2, female: 2, region: "광주", chatEnabled: true, entryTime: "20:45", spent: 95000 },
  { id: 10, name: "D1", status: "empty", guests: 0, male: 0, female: 0, region: "", chatEnabled: false, entryTime: "", spent: 0 },
]

type TableData = typeof tablesData[0]

const statusLabels = {
  active: "이용중",
  empty: "빈테이블",
  reserved: "예약",
  inactive: "비활성",
} as const

const statusStyles = {
  active: "bg-green-500/20 text-green-700 dark:text-green-400",
  empty: "bg-muted text-muted-foreground",
  reserved: "bg-amber-500/20 text-amber-700 dark:text-amber-400",
  inactive: "bg-red-500/10 text-red-600 dark:text-red-400",
} as const

export default function TablesPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const filteredTables = tablesData.filter((table) => {
    const matchesStatus = statusFilter === "all" || table.status === statusFilter
    const matchesSearch = table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      table.region.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const handleOpenDetail = (table: TableData) => {
    setSelectedTable(table)
    setDetailOpen(true)
  }

  const handleExit = () => {
    alert(`${selectedTable?.name} 테이블 퇴장 처리되었습니다.`)
    setDetailOpen(false)
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>테이블 관리</CardTitle>
                <CardDescription>전체 테이블 목록 및 상태 관리</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <IconSearch className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    placeholder="테이블 검색..."
                    className="pl-8 w-[200px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[130px]">
                    <IconFilter className="size-4 mr-2" />
                    <SelectValue placeholder="상태 필터" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="active">이용중</SelectItem>
                    <SelectItem value="empty">빈테이블</SelectItem>
                    <SelectItem value="reserved">예약</SelectItem>
                    <SelectItem value="inactive">비활성</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>테이블</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>인원</TableHead>
                  <TableHead>성비</TableHead>
                  <TableHead>지역</TableHead>
                  <TableHead>입장시간</TableHead>
                  <TableHead>채팅</TableHead>
                  <TableHead className="text-right">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTables.map((table) => (
                  <TableRow key={table.id}>
                    <TableCell className="font-medium">{table.name}</TableCell>
                    <TableCell>
                      <Badge className={cn("font-normal", statusStyles[table.status as keyof typeof statusStyles])}>
                        {statusLabels[table.status as keyof typeof statusLabels]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {table.guests > 0 ? (
                        <span className="flex items-center gap-1">
                          <IconUsers className="size-4" />
                          {table.guests}명
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {table.guests > 0 ? (
                        <span>남 {table.male} / 여 {table.female}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {table.region || <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>
                      {table.entryTime || <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>
                      {table.chatEnabled ? (
                        <IconMessageCircle className="size-4 text-green-600" />
                      ) : (
                        <IconMessageOff className="size-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleOpenDetail(table)}
                      >
                        상세
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredTables.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                검색 결과가 없습니다
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 테이블 상세 모달 */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>테이블 {selectedTable?.name} 상세</DialogTitle>
            <DialogDescription>
              테이블 정보 및 관리
            </DialogDescription>
          </DialogHeader>

          {selectedTable && (
            <div className="space-y-4">
              {/* 상태 */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">상태</span>
                <Badge className={cn("font-normal", statusStyles[selectedTable.status as keyof typeof statusStyles])}>
                  {statusLabels[selectedTable.status as keyof typeof statusLabels]}
                </Badge>
              </div>

              {selectedTable.status === "active" && (
                <>
                  <Separator />
                  
                  {/* 인원 정보 */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">총 인원</Label>
                      <p className="font-medium">{selectedTable.guests}명</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">성비</Label>
                      <p className="font-medium">남 {selectedTable.male} / 여 {selectedTable.female}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">지역</Label>
                      <p className="font-medium">{selectedTable.region}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">입장시간</Label>
                      <p className="font-medium">{selectedTable.entryTime}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* 이용 금액 */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">현재 이용금액</span>
                    <span className="font-semibold text-lg">
                      {selectedTable.spent.toLocaleString()}원
                    </span>
                  </div>

                  <Separator />

                  {/* 채팅 설정 */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>채팅 허용</Label>
                      <p className="text-xs text-muted-foreground">다른 테이블과 채팅 가능</p>
                    </div>
                    <Switch checked={selectedTable.chatEnabled} />
                  </div>

                  <Separator />

                  {/* 액션 버튼 */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="gap-2">
                      <IconGift className="size-4" />
                      선물 보내기
                    </Button>
                    <Button variant="outline" className="gap-2">
                      <IconBan className="size-4" />
                      채팅 제재
                    </Button>
                  </div>
                  <Button 
                    variant="destructive" 
                    className="w-full gap-2"
                    onClick={handleExit}
                  >
                    <IconUserMinus className="size-4" />
                    퇴장 처리
                  </Button>
                </>
              )}

              {selectedTable.status === "empty" && (
                <div className="py-4 text-center text-muted-foreground">
                  현재 빈 테이블입니다.
                </div>
              )}

              {selectedTable.status === "reserved" && (
                <div className="py-4 text-center">
                  <p className="text-muted-foreground mb-2">예약된 테이블입니다.</p>
                  <p className="text-sm">예약시간: 21:30</p>
                  <p className="text-sm">예약인원: 4명</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
