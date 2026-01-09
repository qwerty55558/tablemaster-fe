"use client"

import * as React from "react"
import {
  IconKey,
  IconEye,
  IconEyeOff,
  IconCopy,
  IconRefresh,
  IconAlertCircle,
  IconShieldCheck,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAppSecret } from "@/hooks/use-admin"
import { toast } from "sonner"

function maskSecret(secret: string): string {
  if (secret.length <= 8) return "****"
  return secret.slice(0, 4) + "****" + secret.slice(-4)
}

export function SecretKeyTab() {
  const [isVisible, setIsVisible] = React.useState(false)
  const { data, isLoading, isError, error, refetch } = useAppSecret()

  const copyToClipboard = () => {
    if (!data?.appSecret) return
    navigator.clipboard.writeText(data.appSecret)
    toast.success("시크릿키가 클립보드에 복사되었습니다")
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <IconAlertCircle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-lg font-medium text-destructive mb-2">
            시크릿키를 불러오는데 실패했습니다
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            {error?.message || "알 수 없는 오류가 발생했습니다"}
          </p>
          <Button onClick={() => refetch()} variant="outline">
            <IconRefresh className="mr-2 h-4 w-4" />
            다시 시도
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <IconKey className="h-5 w-5 text-primary" />
          <CardTitle>App Secret</CardTitle>
        </div>
        <CardDescription>
          디바이스 로그인에 사용되는 인증 키입니다. 외부에 노출되지 않도록 주의하세요.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border bg-muted/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <IconShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">현재 시크릿키</p>
                <code className="text-lg font-mono font-medium">
                  {isVisible ? data?.appSecret : maskSecret(data?.appSecret || "")}
                </code>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsVisible(!isVisible)}
                title={isVisible ? "숨기기" : "보기"}
              >
                {isVisible ? (
                  <IconEyeOff className="h-4 w-4" />
                ) : (
                  <IconEye className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
                title="복사"
              >
                <IconCopy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950 p-4">
          <div className="flex gap-3">
            <IconAlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium mb-1">보안 주의사항</p>
              <ul className="list-disc list-inside space-y-1 text-amber-700 dark:text-amber-300">
                <li>시크릿키는 외부에 절대 공유하지 마세요</li>
                <li>디바이스 앱에만 안전하게 저장하세요</li>
                <li>키 변경이 필요한 경우 관리자에게 문의하세요</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
