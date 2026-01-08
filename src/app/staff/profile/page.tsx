"use client"

import { useState } from "react"
import {
  IconBell,
  IconBellOff,
  IconCamera,
  IconCheck,
  IconLock,
  IconMail,
  IconMessageCircle,
  IconUser,
  IconAlertTriangle,
  IconUsers,
} from "@tabler/icons-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"

// 더미 사용자 데이터
const mockUser = {
  name: "김스태프",
  email: "staff@tablemaster.com",
  phone: "010-1234-5678",
  avatar: "",
  role: "STAFF",
  joinedAt: "2024-01-15",
}

// 더미 알림 설정
const mockNotifications = {
  newChat: true,
  chatWarning: true,
  newEntry: false,
  systemAlert: true,
}

export default function ProfilePage() {
  // 프로필 정보
  const [name, setName] = useState(mockUser.name)
  const [phone, setPhone] = useState(mockUser.phone)
  const [isProfileSaving, setIsProfileSaving] = useState(false)

  // 비밀번호 변경
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isPasswordSaving, setIsPasswordSaving] = useState(false)

  // 알림 설정
  const [notifications, setNotifications] = useState(mockNotifications)

  const handleProfileSave = async () => {
    setIsProfileSaving(true)
    // TODO: API 연동
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsProfileSaving(false)
    alert("프로필이 저장되었습니다.")
  }

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      alert("새 비밀번호가 일치하지 않습니다.")
      return
    }
    if (newPassword.length < 8) {
      alert("비밀번호는 8자 이상이어야 합니다.")
      return
    }
    setIsPasswordSaving(true)
    // TODO: API 연동
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsPasswordSaving(false)
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    alert("비밀번호가 변경되었습니다.")
  }

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
    // TODO: API 연동 (자동 저장)
  }

  const handleAvatarChange = () => {
    // TODO: 파일 업로드 구현
    alert("프로필 사진 변경 기능은 준비 중입니다.")
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">내 프로필</h1>
          <p className="text-muted-foreground">계정 정보 및 설정을 관리합니다.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* 프로필 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconUser className="size-5" />
                프로필 정보
              </CardTitle>
              <CardDescription>
                기본 프로필 정보를 수정할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 프로필 사진 */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="size-20">
                    <AvatarImage src={mockUser.avatar} alt={name} />
                    <AvatarFallback className="text-xl">
                      {name.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute -bottom-1 -right-1 size-8 rounded-full"
                    onClick={handleAvatarChange}
                  >
                    <IconCamera className="size-4" />
                  </Button>
                </div>
                <div>
                  <p className="font-medium">{name}</p>
                  <Badge variant="secondary" className="mt-1">
                    {mockUser.role === "STAFF" ? "스태프" : "관리자"}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    가입일: {mockUser.joinedAt}
                  </p>
                </div>
              </div>

              <Separator />

              {/* 이름 */}
              <div className="space-y-2">
                <Label htmlFor="name">이름</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="이름을 입력하세요"
                />
              </div>

              {/* 이메일 (읽기 전용) */}
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <div className="relative">
                  <IconMail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="email"
                    value={mockUser.email}
                    disabled
                    className="pl-9 bg-muted"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  이메일은 변경할 수 없습니다.
                </p>
              </div>

              {/* 전화번호 */}
              <div className="space-y-2">
                <Label htmlFor="phone">전화번호</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010-0000-0000"
                />
              </div>

              <Button
                className="w-full"
                onClick={handleProfileSave}
                disabled={isProfileSaving}
              >
                {isProfileSaving ? "저장 중..." : "프로필 저장"}
              </Button>
            </CardContent>
          </Card>

          {/* 비밀번호 변경 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconLock className="size-5" />
                비밀번호 변경
              </CardTitle>
              <CardDescription>
                보안을 위해 주기적으로 비밀번호를 변경해주세요.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">현재 비밀번호</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="현재 비밀번호 입력"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">새 비밀번호</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="새 비밀번호 입력"
                />
                <p className="text-xs text-muted-foreground">
                  8자 이상, 영문/숫자/특수문자 포함 권장
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="새 비밀번호 다시 입력"
                />
              </div>

              <Button
                className="w-full"
                onClick={handlePasswordChange}
                disabled={isPasswordSaving || !currentPassword || !newPassword || !confirmPassword}
              >
                {isPasswordSaving ? "변경 중..." : "비밀번호 변경"}
              </Button>
            </CardContent>
          </Card>

          {/* 알림 설정 */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconBell className="size-5" />
                알림 설정
              </CardTitle>
              <CardDescription>
                받고 싶은 알림을 선택하세요. 변경 사항은 자동으로 저장됩니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {/* 새 채팅 알림 */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-blue-500/10 p-2">
                      <IconMessageCircle className="size-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">새 채팅 알림</p>
                      <p className="text-sm text-muted-foreground">
                        테이블 간 새 채팅이 시작되면 알림
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.newChat}
                    onCheckedChange={() => handleNotificationChange("newChat")}
                  />
                </div>

                {/* 채팅 경고 알림 */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-amber-500/10 p-2">
                      <IconAlertTriangle className="size-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium">채팅 경고 알림</p>
                      <p className="text-sm text-muted-foreground">
                        금칙어 감지 시 알림
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.chatWarning}
                    onCheckedChange={() => handleNotificationChange("chatWarning")}
                  />
                </div>

                {/* 새 입장 알림 */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-green-500/10 p-2">
                      <IconUsers className="size-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">새 입장 알림</p>
                      <p className="text-sm text-muted-foreground">
                        새 손님이 입장하면 알림
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.newEntry}
                    onCheckedChange={() => handleNotificationChange("newEntry")}
                  />
                </div>

                {/* 시스템 알림 */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-purple-500/10 p-2">
                      <IconBell className="size-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">시스템 알림</p>
                      <p className="text-sm text-muted-foreground">
                        시스템 공지 및 업데이트 알림
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.systemAlert}
                    onCheckedChange={() => handleNotificationChange("systemAlert")}
                  />
                </div>
              </div>

              {/* 현재 알림 상태 요약 */}
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                {Object.values(notifications).some(Boolean) ? (
                  <>
                    <IconBell className="size-4 text-primary" />
                    <span>
                      {Object.values(notifications).filter(Boolean).length}개의 알림이 활성화되어 있습니다.
                    </span>
                  </>
                ) : (
                  <>
                    <IconBellOff className="size-4" />
                    <span>모든 알림이 비활성화되어 있습니다.</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
