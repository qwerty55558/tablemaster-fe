"use client"

import { useState } from "react"
import {
  IconHelp,
  IconCreditCard,
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
      "등록된 디바이스 목록을 조회하고 이름을 수정할 수 있습니다.",
      "활성/비활성 전환으로 디바이스 로그인 가능 여부를 제어합니다.",
      "등록 요청 확인에서 대기 중 디바이스를 승인할 수 있습니다.",
    ],
  },
  {
    icon: IconKey,
    title: "시크릿키",
    items: [
      "App Secret 조회, 마스킹 해제, 복사를 지원합니다.",
      "디바이스 로그인 연동용 값이므로 외부 노출을 피해야 합니다.",
      "현재 화면에서는 키 재발급 기능은 제공하지 않습니다.",
    ],
  },
  {
    icon: IconShield,
    title: "권한 안내",
    items: [
      "Admin은 디바이스 관리와 시크릿키 조회 권한을 가집니다.",
      "Staff 화면 전환 버튼으로 운영 화면을 함께 확인할 수 있습니다.",
      "실제 운영 기능은 Staff 메뉴에서 수행됩니다.",
    ],
  },
  {
    icon: IconCreditCard,
    title: "결제 내역",
    items: [
      "전체 bill 목록을 상태별로 조회할 수 있습니다.",
      "상세 모달에서 주문, 선물, 총액과 원본 응답을 확인합니다.",
      "같은 테이블의 bill 히스토리도 상세 화면에서 함께 조회합니다.",
    ],
  },
  {
    icon: IconQuestionMark,
    title: "FAQ",
    items: [
      "디바이스 로그인 실패 시 활성 상태와 등록 여부를 먼저 확인하세요.",
      "승인 대기 디바이스는 등록 요청 확인에서 처리할 수 있습니다.",
      "시크릿키 확인은 관리자 대시보드의 시크릿키 탭에서 수행합니다.",
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
            현재 구현된 관리자 기능 기준 사용 가이드
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
