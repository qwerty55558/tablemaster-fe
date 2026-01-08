"use client"

import { useState } from "react"
import {
  IconCheck,
  IconClock,
  IconMinus,
  IconPlus,
  IconUsers,
  IconTrash,
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
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

// 빈 테이블 더미 데이터
const emptyTables = [
  { id: 3, name: "A3" },
  { id: 6, name: "B3" },
  { id: 10, name: "D1" },
  { id: 11, name: "D2" },
  { id: 12, name: "D3" },
]

// 대기열 더미 데이터
const waitingQueue = [
  { id: 1, name: "홍길동", guests: 4, male: 2, female: 2, waitTime: "15분", phone: "010-****-1234" },
  { id: 2, name: "김철수", guests: 2, male: 1, female: 1, waitTime: "8분", phone: "010-****-5678" },
  { id: 3, name: "이영희", guests: 6, male: 3, female: 3, waitTime: "3분", phone: "010-****-9012" },
]

// 최근 입장 기록 더미 데이터
const recentEntries = [
  { id: 1, table: "A1", guests: 4, male: 2, female: 2, region: "서울", time: "20:45", staff: "김스태프" },
  { id: 2, table: "B1", guests: 6, male: 3, female: 3, region: "서울", time: "20:30", staff: "이스태프" },
  { id: 3, table: "C1", guests: 5, male: 2, female: 3, region: "대구", time: "20:15", staff: "김스태프" },
  { id: 4, table: "B2", guests: 2, male: 1, female: 1, region: "인천", time: "20:00", staff: "이스태프" },
]

const regions = [
  "서울", "부산", "대구", "인천", "광주", 
  "대전", "울산", "세종", "경기", "강원",
  "충북", "충남", "전북", "전남", "경북", 
  "경남", "제주", "해외"
]

export default function EntryPage() {
  const [selectedTable, setSelectedTable] = useState<string>("")
  const [maleCount, setMaleCount] = useState(0)
  const [femaleCount, setFemaleCount] = useState(0)
  const [region, setRegion] = useState<string>("")
  const [chatEnabled, setChatEnabled] = useState(true)

  const totalGuests = maleCount + femaleCount

  const handleSubmit = () => {
    console.log({
      table: selectedTable,
      male: maleCount,
      female: femaleCount,
      region,
      chatEnabled,
    })
    alert(`테이블 ${selectedTable}에 ${totalGuests}명 입장 등록 완료`)
    setSelectedTable("")
    setMaleCount(0)
    setFemaleCount(0)
    setRegion("")
    setChatEnabled(true)
  }

  const handleQueueEntry = (queueItem: typeof waitingQueue[0]) => {
    if (!selectedTable) {
      alert("먼저 테이블을 선택해주세요.")
      return
    }
    setMaleCount(queueItem.male)
    setFemaleCount(queueItem.female)
    alert(`${queueItem.name}님을 테이블 ${selectedTable}에 배정합니다.`)
  }

  const isValid = selectedTable && totalGuests > 0 && region

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* 입장 등록 폼 */}
          <Card>
            <CardHeader>
              <CardTitle>입장 등록</CardTitle>
              <CardDescription>새로운 손님 입장 정보를 입력하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 테이블 선택 */}
              <div className="space-y-2">
                <Label>테이블 선택</Label>
                <Select value={selectedTable} onValueChange={setSelectedTable}>
                  <SelectTrigger>
                    <SelectValue placeholder="빈 테이블을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {emptyTables.map((table) => (
                      <SelectItem key={table.id} value={table.name}>
                        테이블 {table.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 인원 입력 */}
              <div className="space-y-4">
                <Label>인원 수</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">남성</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setMaleCount(Math.max(0, maleCount - 1))}
                        disabled={maleCount === 0}
                      >
                        <IconMinus className="size-4" />
                      </Button>
                      <Input
                        type="number"
                        value={maleCount}
                        onChange={(e) => setMaleCount(Math.max(0, parseInt(e.target.value) || 0))}
                        className="text-center"
                        min={0}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setMaleCount(maleCount + 1)}
                      >
                        <IconPlus className="size-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">여성</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setFemaleCount(Math.max(0, femaleCount - 1))}
                        disabled={femaleCount === 0}
                      >
                        <IconMinus className="size-4" />
                      </Button>
                      <Input
                        type="number"
                        value={femaleCount}
                        onChange={(e) => setFemaleCount(Math.max(0, parseInt(e.target.value) || 0))}
                        className="text-center"
                        min={0}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setFemaleCount(femaleCount + 1)}
                      >
                        <IconPlus className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                {totalGuests > 0 && (
                  <p className="text-sm text-muted-foreground">
                    총 {totalGuests}명 (남 {maleCount}, 여 {femaleCount})
                  </p>
                )}
              </div>

              {/* 지역 선택 */}
              <div className="space-y-2">
                <Label>지역</Label>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger>
                    <SelectValue placeholder="지역을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 채팅 허용 */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="chatEnabled"
                  checked={chatEnabled}
                  onCheckedChange={(checked) => setChatEnabled(checked as boolean)}
                />
                <Label htmlFor="chatEnabled" className="cursor-pointer">
                  다른 테이블과 채팅 허용
                </Label>
              </div>

              {/* 등록 버튼 */}
              <Button
                className="w-full"
                size="lg"
                onClick={handleSubmit}
                disabled={!isValid}
              >
                <IconCheck className="size-4 mr-2" />
                입장 등록
              </Button>
            </CardContent>
          </Card>

          {/* 오른쪽 영역 */}
          <div className="space-y-6">
            {/* 빈 테이블 현황 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">빈 테이블 현황</CardTitle>
                <CardDescription>클릭하여 테이블 선택</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {emptyTables.map((table) => (
                    <button
                      key={table.id}
                      onClick={() => setSelectedTable(table.name)}
                      className={cn(
                        "flex flex-col items-center justify-center rounded-lg border-2 p-3 transition-colors hover:bg-accent",
                        selectedTable === table.name
                          ? "border-primary bg-primary/10"
                          : "border-muted"
                      )}
                    >
                      <span className="text-lg font-bold">{table.name}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 대기열 */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">대기열</CardTitle>
                    <CardDescription>{waitingQueue.length}팀 대기중</CardDescription>
                  </div>
                  <Badge variant="secondary">
                    <IconClock className="size-3 mr-1" />
                    실시간
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {waitingQueue.map((item, index) => (
                    <div 
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.guests}명 (남{item.male}/여{item.female}) · {item.waitTime} 대기
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleQueueEntry(item)}
                        >
                          입장
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive">
                          <IconTrash className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 최근 입장 기록 */}
        <Card className="mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">최근 입장 기록</CardTitle>
            <CardDescription>오늘 입장한 손님 목록</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>테이블</TableHead>
                  <TableHead>인원</TableHead>
                  <TableHead>성비</TableHead>
                  <TableHead>지역</TableHead>
                  <TableHead>입장시간</TableHead>
                  <TableHead>담당자</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.table}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <IconUsers className="size-4" />
                        {entry.guests}명
                      </span>
                    </TableCell>
                    <TableCell>남 {entry.male} / 여 {entry.female}</TableCell>
                    <TableCell>{entry.region}</TableCell>
                    <TableCell>{entry.time}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{entry.staff}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
