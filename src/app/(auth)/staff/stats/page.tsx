import {
  IconTrendingUp,
  IconUsers,
  IconMessageCircle,
  IconCalendar,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// 오늘 통계 더미 데이터
const todayStats = {
  totalGuests: 156,
  maleGuests: 82,
  femaleGuests: 74,
  peakHour: "21:00",
  peakGuests: 45,
  totalChats: 89,
  avgChatDuration: "12분",
}

// 주간 추이 더미 데이터
const weeklyData = [
  { day: "월", guests: 120, chats: 65 },
  { day: "화", guests: 98, chats: 52 },
  { day: "수", guests: 145, chats: 78 },
  { day: "목", guests: 132, chats: 71 },
  { day: "금", guests: 189, chats: 95 },
  { day: "토", guests: 210, chats: 112 },
  { day: "일", guests: 156, chats: 89 },
]

export default function StatsPage() {
  const maxGuests = Math.max(...weeklyData.map(d => d.guests))

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6 space-y-6">
        {/* 오늘 요약 */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>오늘 입장객</CardDescription>
              <CardTitle className="text-2xl">{todayStats.totalGuests}명</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <IconUsers className="size-4" />
                남 {todayStats.maleGuests} / 여 {todayStats.femaleGuests}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>피크 시간</CardDescription>
              <CardTitle className="text-2xl">{todayStats.peakHour}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <IconTrendingUp className="size-4" />
                최대 {todayStats.peakGuests}명
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>총 채팅 수</CardDescription>
              <CardTitle className="text-2xl">{todayStats.totalChats}건</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <IconMessageCircle className="size-4" />
                평균 {todayStats.avgChatDuration}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>성비</CardDescription>
              <CardTitle className="text-2xl">
                {Math.round((todayStats.maleGuests / todayStats.totalGuests) * 100)}% / {Math.round((todayStats.femaleGuests / todayStats.totalGuests) * 100)}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                남성 / 여성 비율
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 주간 입장객 추이 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>주간 입장객 추이</CardTitle>
                <CardDescription>최근 7일간 입장객 통계</CardDescription>
              </div>
              <Badge variant="outline">
                <IconCalendar className="size-3 mr-1" />
                이번 주
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {/* 간단한 바 차트 */}
            <div className="flex items-end justify-between gap-2 h-[200px]">
              {weeklyData.map((data) => (
                <div key={data.day} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col items-center gap-1">
                    <span className="text-xs font-medium">{data.guests}</span>
                    <div 
                      className="w-full bg-primary/80 rounded-t"
                      style={{ 
                        height: `${(data.guests / maxGuests) * 150}px`,
                        minHeight: '20px'
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{data.day}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 지역별 통계 */}
        <Card>
          <CardHeader>
            <CardTitle>지역별 방문객</CardTitle>
            <CardDescription>오늘 방문객의 지역 분포</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { region: "서울", count: 68, percent: 44 },
                { region: "경기", count: 32, percent: 21 },
                { region: "부산", count: 18, percent: 12 },
                { region: "인천", count: 15, percent: 10 },
                { region: "기타", count: 23, percent: 15 },
              ].map((item) => (
                <div key={item.region} className="flex items-center gap-4">
                  <span className="w-12 text-sm font-medium">{item.region}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                  <span className="w-16 text-sm text-muted-foreground text-right">
                    {item.count}명 ({item.percent}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
