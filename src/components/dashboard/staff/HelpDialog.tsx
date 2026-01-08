"use client"

import { useState } from "react"
import {
  IconHelp,
  IconLayoutGrid,
  IconMessageCircle,
  IconShieldCheck,
  IconUserPlus,
} from "@tabler/icons-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  SidebarMenuButton,
} from "@/components/ui/sidebar"

const helpItems = [
  {
    icon: IconLayoutGrid,
    title: "테이블 관리",
    items: [
      "전체 테이블 상태를 한눈에 확인",
      "초록(이용중), 회색(빈테이블), 노랑(예약)",
      "테이블 클릭 시 상세 정보 확인",
    ],
  },
  {
    icon: IconUserPlus,
    title: "입장 등록",
    items: [
      "빈 테이블 선택 후 손님 정보 입력",
      "인원(남/여), 지역, 채팅 허용 설정",
      "등록 완료 시 테이블 상태 자동 변경",
    ],
  },
  {
    icon: IconMessageCircle,
    title: "채팅 모니터",
    items: [
      "테이블 간 실시간 채팅 모니터링",
      "경고 아이콘: 금칙어 감지된 채팅방",
      "문제 발생 시 '채팅 제재' 버튼 사용",
    ],
  },
  {
    icon: IconShieldCheck,
    title: "채팅 관리",
    items: [
      "금칙어 등록으로 자동 필터링",
      "제재 유형: 경고, 채팅제한, 이용정지",
      "모든 제재 내역은 로그로 기록",
    ],
  },
]

export function HelpDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <SidebarMenuButton tooltip="도움말">
          <IconHelp />
          <span>도움말</span>
        </SidebarMenuButton>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconHelp className="size-5" />
            도움말
          </DialogTitle>
          <DialogDescription>
            TableMaster 스태프 시스템 사용 가이드
          </DialogDescription>
        </DialogHeader>
        
        {/* 2x2 그리드 */}
        <div className="grid grid-cols-2 gap-4 mt-2">
          {helpItems.map((section, index) => (
            <div 
              key={index}
              className="rounded-lg border bg-muted/30 p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="rounded-md bg-primary/10 p-1.5">
                  <section.icon className="size-4 text-primary" />
                </div>
                <h3 className="font-semibold">{section.title}</h3>
              </div>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {section.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* 문의처 - 한 줄로 */}
        <div className="mt-4 pt-4 border-t text-sm text-muted-foreground flex items-center justify-between">
          <span>문의: 매니저 또는 내선 100번</span>
          <span>support@tablemaster.com</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
