import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { LogoIcon } from "@/components/ui/logo"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8">
            <FieldGroup>
              {/* Logo & Title */}
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                  <LogoIcon className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">TableMaster</h1>
                  <p className="text-muted-foreground text-sm mt-1">
                    계정에 로그인하세요
                  </p>
                </div>
              </div>

              {/* Email */}
              <Field>
                <FieldLabel htmlFor="email">이메일</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  required
                />
              </Field>

              {/* Password */}
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">비밀번호</FieldLabel>
                  <Link
                    href="/forgot-password"
                    className="ml-auto text-sm text-muted-foreground underline-offset-2 hover:underline hover:text-foreground"
                  >
                    비밀번호 찾기
                  </Link>
                </div>
                <Input id="password" type="password" required />
              </Field>

              {/* Login Button */}
              <Field>
                <Button type="submit" className="w-full">
                  로그인
                </Button>
              </Field>

              {/* Separator */}
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                또는
              </FieldSeparator>

              {/* Social Login */}
              <Field className="grid grid-cols-2 gap-3">
                <Button type="button" className="w-full">
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  Google
                </Button>
                <Button type="button" className="w-full bg-[#FEE500] text-[#191919] hover:bg-[#FDD835]">
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <path
                      d="M12 3C6.477 3 2 6.463 2 10.754c0 2.756 1.819 5.18 4.548 6.567-.2.744-.725 2.696-.832 3.118-.13.512.188.505.396.367.163-.109 2.593-1.757 3.639-2.469.727.107 1.478.163 2.249.163 5.523 0 10-3.463 10-7.746S17.523 3 12 3z"
                      fill="#191919"
                    />
                  </svg>
                  Kakao
                </Button>
              </Field>

              {/* Sign Up Link */}
              <FieldDescription className="text-center">
                계정이 없으신가요?{" "}
                <Link href="/signup" className="text-foreground underline underline-offset-2 hover:text-primary">
                  회원가입
                </Link>
              </FieldDescription>
            </FieldGroup>
          </form>

          {/* Right Side - Table Order Image */}
          <div className="relative hidden md:block">
            <Image
              src="/images/table-order-bg.jpg"
              alt="테이블 오더 시스템"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="bg-white/15 backdrop-blur-md rounded-2xl p-5 border border-white/20">
                <h2 className="text-xl font-bold mb-1.5 text-white">TableMaster</h2>
                <p className="text-white/90 text-sm leading-relaxed">
                  테이블 오더 관리의 모든 것.
                  <br />
                  주문부터 결제까지 한 번에 관리하세요.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Terms */}
      <FieldDescription className="px-6 text-center text-xs">
        계속 진행하면{" "}
        <Link href="/terms" className="underline underline-offset-2 hover:text-foreground">
          서비스 이용약관
        </Link>{" "}
        및{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
          개인정보 처리방침
        </Link>
        에 동의하는 것으로 간주됩니다.
      </FieldDescription>
    </div>
  )
}
