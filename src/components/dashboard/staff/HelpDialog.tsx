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
      "테이블 목록에서 상태, 인원, 위치, 채팅 상태를 확인합니다.",
      "상세 보기에서 실제 테이블 정보와 채팅 제재 상태를 조회합니다.",
      "이용 중 테이블은 상세 화면에서 퇴장 처리할 수 있습니다.",
    ],
  },
  {
    icon: IconUserPlus,
    title: "입장 등록",
    items: [
      "가용 디바이스를 선택해 테이블명, 지역, 인원을 등록합니다.",
      "등록이 완료되면 해당 디바이스가 테이블로 활성화됩니다.",
      "하단 입장 이력에서 최근 기록과 사용 시간을 확인할 수 있습니다.",
    ],
  },
  {
    icon: IconMessageCircle,
    title: "채팅 모니터",
    items: [
      "채팅방 목록, 참여 테이블, 메시지 히스토리를 조회합니다.",
      "방 단위 제재, 참여자 음소거, 디바이스 알림 전송이 가능합니다.",
      "실시간 이벤트 알림을 클릭하면 관련 화면으로 이동합니다.",
    ],
  },
  {
    icon: IconShieldCheck,
    title: "채팅 관리",
    items: [
      "대기 중 신고를 승인 또는 반려하고 제재를 적용할 수 있습니다.",
      "금칙어 목록 조회, 추가, 수정, 활성/비활성, 삭제가 가능합니다.",
      "제재 이력 탭에서 처리 결과와 상세 payload를 확인합니다.",
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
            현재 구현된 스태프 기능 기준 사용 가이드
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
