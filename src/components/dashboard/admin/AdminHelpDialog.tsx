"use client"

import { useState } from "react"
import {
  IconHelp,
  IconDevices,
  IconKey,
  IconShield,
  IconQuestionMark,
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
    icon: IconDevices,
    title: "디바이스 관리",
    items: [
      "디바이스 등록: Device ID와 이름 입력",
      "활성/비활성 토글로 접근 제어",
      "등록된 디바이스만 로그인 가능",
    ],
  },
  {
    icon: IconKey,
    title: "시크릿키",
    items: [
      "디바이스 로그인에 필요한 인증 키",
      "외부 노출 절대 금지",
      "디바이스 앱에만 안전하게 저장",
    ],
  },
  {
    icon: IconShield,
    title: "권한 안내",
    items: [
      "Admin: 시스템 관리 및 설정",
      "Staff: 현장 테이블/채팅 운영",
      "Admin은 Staff 뷰 전환 가능",
    ],
  },
  {
    icon: IconQuestionMark,
    title: "FAQ",
    items: [
      "디바이스 로그인 실패 → 화이트리스트 확인",
      "시크릿키 변경 → 서버 관리자 문의",
      "Staff 뷰 전환 → 사이드바 토글 사용",
    ],
  },
]

export function AdminHelpDialog() {
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
            관리자 도움말
          </DialogTitle>
          <DialogDescription>
            TableMaster 관리자 시스템 사용 가이드
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
          <span>기술지원: 시스템 관리팀</span>
          <span>admin-support@tablemaster.com</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
