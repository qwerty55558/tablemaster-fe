"use client"
/* eslint-disable react-hooks/incompatible-library */

import { useState, useCallback, useEffect, useMemo } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Loader2,
  User,
  Lock,
  FileCheck,
  ArrowRight,
  ArrowLeft,
  Check,
  Mail,
  Phone,
  Shield,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { LogoIcon } from "@/components/ui/logo"
import { checkEmailAvailability, signup, SignupError } from "@/lib/api/auth"
import { useRouter } from "next/navigation"
import { type ValidationConfig } from "@/lib/validation/config"
import { createSignupSchema, type SignupFormData } from "@/lib/validation/schemas"

// ================================
// 스텝 설정
// ================================

const steps = [
  { id: 1, title: "기본 정보", icon: User },
  { id: 2, title: "비밀번호", icon: Lock },
  { id: 3, title: "약관 동의", icon: FileCheck },
]

// ================================
// 이메일 중복확인 상태 타입
// ================================
type EmailCheckStatus = "idle" | "checking" | "available" | "unavailable" | "error"

// ================================
// 중복확인 내부 쿨다운 설정 (ms) - UI에 표시하지 않음
// ================================
const EMAIL_CHECK_COOLDOWN = 2000

// ================================
// Props 타입
// ================================
interface SignupFormProps extends React.ComponentProps<"div"> {
  validationConfig: ValidationConfig
}

// ================================
// 컴포넌트 (SSG - 서버에서 빌드 시 config 전달받음)
// ================================

export function SignupForm({
  className,
  validationConfig,
  ...props
}: SignupFormProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // 동적 스키마 생성
  const signupSchema = useMemo(() => {
    return createSignupSchema(validationConfig)
  }, [validationConfig])

  // 이메일 중복확인 상태
  const [emailCheckStatus, setEmailCheckStatus] = useState<EmailCheckStatus>("idle")
  const [emailCheckMessage, setEmailCheckMessage] = useState("")
  const [lastCheckedEmail, setLastCheckedEmail] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    trigger,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      agreeTerms: false,
      agreePrivacy: false,
      agreeMarketing: false,
    },
    mode: "onChange",
  })

  const agreeTerms = watch("agreeTerms")
  const agreePrivacy = watch("agreePrivacy")
  const agreeMarketing = watch("agreeMarketing")
  const password = watch("password")
  const phone = watch("phone")
  const email = watch("email")

  // 중복확인 내부 쿨다운 (UI에 표시하지 않음)
  const [lastCheckTime, setLastCheckTime] = useState<number>(0)

  // 이메일 중복확인 함수
  const handleCheckEmail = useCallback(async () => {
    const currentEmail = email

    // 내부 쿨다운 체크 (UI에 표시하지 않고 조용히 무시)
    const now = Date.now()
    const timeSinceLastCheck = now - lastCheckTime
    if (timeSinceLastCheck < EMAIL_CHECK_COOLDOWN) {
      return
    }

    // 이메일 형식 검증 (클라이언트 사전 체크)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!currentEmail || !emailRegex.test(currentEmail)) {
      setEmailCheckStatus("error")
      setEmailCheckMessage("올바른 이메일 형식을 입력해주세요")
      return
    }

    // 이미 확인한 이메일이면 스킵
    if (currentEmail === lastCheckedEmail && emailCheckStatus === "available") {
      return
    }

    setEmailCheckStatus("checking")
    setEmailCheckMessage("")
    setLastCheckTime(now)

    try {
      const result = await checkEmailAvailability(currentEmail)
      
      if (result.available) {
        setEmailCheckStatus("available")
        setEmailCheckMessage("사용 가능한 이메일입니다")
        setLastCheckedEmail(currentEmail)
      } else {
        setEmailCheckStatus("unavailable")
        setEmailCheckMessage(result.message || "이미 사용 중인 이메일입니다")
      }
    } catch {
      setEmailCheckStatus("error")
      setEmailCheckMessage("이메일 확인 중 오류가 발생했습니다. 다시 시도해주세요.")
    }
  }, [email, lastCheckedEmail, emailCheckStatus, lastCheckTime])

  // 이메일이 변경되면 상태 초기화
  useEffect(() => {
    if (email !== lastCheckedEmail) {
      setEmailCheckStatus("idle")
      setEmailCheckMessage("")
    }
  }, [email, lastCheckedEmail])

  // 비밀번호 강도 체크
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { level: 0, text: "", color: "" }
    let score = 0
    if (pwd.length >= 8) score++
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++
    if (/\d/.test(pwd)) score++
    if (/[^a-zA-Z0-9]/.test(pwd)) score++

    if (score <= 1) return { level: 1, text: "약함", color: "bg-red-500" }
    if (score === 2) return { level: 2, text: "보통", color: "bg-yellow-500" }
    if (score === 3) return { level: 3, text: "강함", color: "bg-green-500" }
    return { level: 4, text: "매우 강함", color: "bg-emerald-500" }
  }

  const passwordStrength = getPasswordStrength(password)

  const handleNextStep = async () => {
    let isValid = false
    if (currentStep === 1) {
      isValid = await trigger(["name", "email", "phone"])
      
      // 이메일 중복확인 필수 체크
      if (isValid && emailCheckStatus !== "available") {
        setEmailCheckStatus("error")
        setEmailCheckMessage("이메일 중복확인을 해주세요")
        return
      }
    } else if (currentStep === 2) {
      isValid = await trigger(["password", "confirmPassword"])
    }
    if (isValid) setCurrentStep((prev) => Math.min(prev + 1, 3))
  }

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  // 엔터 키로 다음 스텝 이동 (마지막 스텝 제외)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && currentStep < 3) {
      e.preventDefault()
      handleNextStep()
    }
  }

  const onSubmit = async (data: SignupFormData) => {
    setSubmitError(null)
    
    try {
      const result = await signup({
        name: data.name,
        email: data.email,
        phone: data.phone.replace(/-/g, ""), // 하이픈 제거
        password: data.password,
        agreeService: data.agreeTerms,
        agreePrivacy: data.agreePrivacy,
        agreeMarketing: data.agreeMarketing,
      })
      
      console.log("회원가입 성공:", result)
      
      // 성공 시 로그인 페이지로 이동
      router.push("/login?signup=success")
    } catch (error) {
      console.error("회원가입 오류:", error)
      
      if (error instanceof SignupError) {
        // 필드별 에러가 있으면 해당 필드에 표시
        const fieldErrors = error.getAllFieldErrors()
        if (Object.keys(fieldErrors).length > 0) {
          // 각 필드에 서버 에러 메시지 설정
          Object.entries(fieldErrors).forEach(([field, message]) => {
            // 필드명 매핑 (서버 필드명 -> 폼 필드명)
            const formField = field === "agreeService" ? "agreeTerms" : field
            if (formField in errors || ["name", "email", "phone", "password"].includes(formField)) {
              // setError는 react-hook-form에서 제공
              console.log(`서버 에러 [${formField}]: ${message}`)
            }
          })
        }
        setSubmitError(error.message)
      } else if (error instanceof Error) {
        setSubmitError(error.message)
      } else {
        setSubmitError("회원가입 중 오류가 발생했습니다. 다시 시도해주세요.")
      }
    }
  }

  // 전화번호 포맷팅 함수
  // 010-XXX-XXXX (10자리) 또는 010-XXXX-XXXX (11자리)
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, "")
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    if (numbers.length <= 10) {
      // 10자리: 010-XXX-XXXX
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`
    }
    // 11자리: 010-XXXX-XXXX
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
  }

  // 전화번호 입력 핸들러
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setValue("phone", formatted, { shouldValidate: true })
  }

  const handleAgreeAll = (checked: boolean) => {
    setValue("agreeTerms", checked, { shouldValidate: true })
    setValue("agreePrivacy", checked, { shouldValidate: true })
    setValue("agreeMarketing", checked)
  }

  const isAllAgreed = agreeTerms && agreePrivacy && agreeMarketing

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden shadow-2xl p-0 gap-0">
        {/* Header */}
        <div className="bg-muted/50 px-6 py-8">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
              <LogoIcon className="h-8 w-8 text-primary-foreground" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold">회원가입</h1>
              <p className="text-sm text-muted-foreground mt-1">
                TableMaster와 함께 시작하세요
              </p>
            </div>
          </div>

          {/* Step Indicator */}
          <div className="mt-8">
            <div className="flex items-center justify-between relative">
              {/* Progress bar background */}
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" />
              {/* Progress bar fill */}
              <div
                className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500"
                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              />

              {steps.map((step) => {
                const StepIcon = step.icon
                const isActive = currentStep === step.id
                const isCompleted = currentStep > step.id

                return (
                  <div key={step.id} className="flex flex-col items-center relative z-10">
                    <div
                      className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300",
                        isCompleted && "bg-primary text-primary-foreground",
                        isActive && "bg-primary text-primary-foreground ring-4 ring-primary/30",
                        !isActive && !isCompleted && "bg-muted text-muted-foreground"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5" strokeWidth={3} />
                      ) : (
                        <StepIcon className="h-5 w-5" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-xs mt-2 font-medium transition-all",
                        isActive || isCompleted ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {step.title}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} onKeyDown={handleKeyDown} className="flex flex-col">
            {/* Step 1: 기본 정보 */}
            <div className={cn("space-y-5", currentStep !== 1 && "hidden")}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="name">이름</FieldLabel>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="홍길동"
                      className="pl-10"
                      aria-invalid={!!errors.name}
                      {...register("name")}
                    />
                  </div>
                  <FieldError>{errors.name?.message}</FieldError>
                </Field>

                <Field>
                  <FieldLabel htmlFor="email">이메일</FieldLabel>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@company.com"
                        className={cn(
                          "pl-10 pr-10",
                          emailCheckStatus === "available" && "border-green-500 focus-visible:ring-green-500",
                          (emailCheckStatus === "unavailable" || emailCheckStatus === "error") && "border-destructive focus-visible:ring-destructive"
                        )}
                        aria-invalid={!!errors.email || emailCheckStatus === "unavailable" || emailCheckStatus === "error"}
                        {...register("email")}
                      />
                      {/* 상태 아이콘 */}
                      {emailCheckStatus === "available" && (
                        <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                      )}
                      {emailCheckStatus === "unavailable" && (
                        <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="default"
                      onClick={handleCheckEmail}
                      disabled={emailCheckStatus === "checking" || emailCheckStatus === "available" || !email || !!errors.email}
                      className="shrink-0 min-w-[90px] cursor-pointer"
                    >
                      {emailCheckStatus === "checking" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : emailCheckStatus === "available" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        "중복확인"
                      )}
                    </Button>
                  </div>
                  {/* 에러 메시지 또는 확인 결과 메시지 */}
                  {errors.email?.message ? (
                    <FieldError>{errors.email.message}</FieldError>
                  ) : emailCheckMessage ? (
                    <p
                      className={cn(
                        "text-sm -mt-1",
                        emailCheckStatus === "available" && "text-green-600",
                        (emailCheckStatus === "unavailable" || emailCheckStatus === "error") && "text-destructive"
                      )}
                    >
                      {emailCheckMessage}
                    </p>
                  ) : null}
                </Field>

                <Field>
                  <FieldLabel htmlFor="phone">전화번호</FieldLabel>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="010-1234-5678"
                      className="pl-10"
                      aria-invalid={!!errors.phone}
                      value={phone}
                      onChange={handlePhoneChange}
                    />
                  </div>
                  <FieldError>{errors.phone?.message}</FieldError>
                </Field>
              </FieldGroup>
            </div>

            {/* Step 2: 비밀번호 설정 */}
            <div className={cn("space-y-5", currentStep !== 2 && "hidden")}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="password">비밀번호</FieldLabel>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="8자 이상 입력"
                      className="pl-10 pr-10"
                      aria-invalid={!!errors.password}
                      {...register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {/* Password strength indicator */}
                  {password && (
                    <div className="space-y-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={cn(
                              "h-1 flex-1 rounded-full transition-all",
                              level <= passwordStrength.level
                                ? passwordStrength.color
                                : "bg-muted"
                            )}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        비밀번호 강도: <span className="font-medium">{passwordStrength.text}</span>
                      </p>
                    </div>
                  )}
                  <FieldError>{errors.password?.message}</FieldError>
                </Field>

                <Field>
                  <FieldLabel htmlFor="confirmPassword">비밀번호 확인</FieldLabel>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="비밀번호를 다시 입력"
                      className="pl-10 pr-10"
                      aria-invalid={!!errors.confirmPassword}
                      {...register("confirmPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <FieldError>{errors.confirmPassword?.message}</FieldError>
                </Field>

                <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-2">비밀번호 요구사항</p>
                  <ul className="space-y-1">
                    <li className={cn("flex items-center gap-2", password.length >= validationConfig.password.minLength && "text-green-600")}>
                      <Check className={cn("h-3 w-3", password.length >= validationConfig.password.minLength ? "opacity-100" : "opacity-30")} />
                      최소 {validationConfig.password.minLength}자 이상
                    </li>
                    {validationConfig.password.requireUppercase && (
                      <li className={cn("flex items-center gap-2", /[A-Z]/.test(password) && "text-green-600")}>
                        <Check className={cn("h-3 w-3", /[A-Z]/.test(password) ? "opacity-100" : "opacity-30")} />
                        대문자 포함
                      </li>
                    )}
                    {validationConfig.password.requireLowercase && (
                      <li className={cn("flex items-center gap-2", /[a-z]/.test(password) && "text-green-600")}>
                        <Check className={cn("h-3 w-3", /[a-z]/.test(password) ? "opacity-100" : "opacity-30")} />
                        소문자 포함
                      </li>
                    )}
                    {validationConfig.password.requireNumber && (
                      <li className={cn("flex items-center gap-2", /\d/.test(password) && "text-green-600")}>
                        <Check className={cn("h-3 w-3", /\d/.test(password) ? "opacity-100" : "opacity-30")} />
                        숫자 포함
                      </li>
                    )}
                    {validationConfig.password.requireSpecialChar && (
                      <li className={cn("flex items-center gap-2", /[@$!%*#?&]/.test(password) && "text-green-600")}>
                        <Check className={cn("h-3 w-3", /[@$!%*#?&]/.test(password) ? "opacity-100" : "opacity-30")} />
                        특수문자 포함 (@$!%*#?&)
                      </li>
                    )}
                  </ul>
                </div>
              </FieldGroup>
            </div>

            {/* Step 3: 약관 동의 */}
            <div className={cn("space-y-5", currentStep !== 3 && "hidden")}>
              <FieldGroup>
                {/* 전체 동의 */}
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                  <Field orientation="horizontal" className="items-center">
                    <Checkbox
                      id="agreeAll"
                      checked={isAllAgreed}
                      onCheckedChange={handleAgreeAll}
                      className="h-5 w-5"
                    />
                    <FieldLabel htmlFor="agreeAll" className="text-base font-semibold cursor-pointer">
                      전체 동의하기
                    </FieldLabel>
                  </Field>
                  <p className="text-xs text-muted-foreground mt-2 ml-7">
                    서비스 이용약관, 개인정보 처리방침, 마케팅 수신에 모두 동의합니다.
                  </p>
                </div>

                <div className="space-y-3">
                  <Field
                    orientation="horizontal"
                    className="items-center p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      id="agreeTerms"
                      checked={agreeTerms}
                      onCheckedChange={(checked) =>
                        setValue("agreeTerms", checked === true, { shouldValidate: true })
                      }
                    />
                    <div className="flex-1">
                      <FieldLabel htmlFor="agreeTerms" className="text-sm font-normal cursor-pointer">
                        <span className="text-primary font-medium">[필수]</span>{" "}
                        서비스 이용약관 동의
                      </FieldLabel>
                    </div>
                    <Link
                      href="/terms"
                      className="text-xs text-muted-foreground hover:text-primary underline"
                    >
                      보기
                    </Link>
                  </Field>

                  <Field
                    orientation="horizontal"
                    className="items-center p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      id="agreePrivacy"
                      checked={agreePrivacy}
                      onCheckedChange={(checked) =>
                        setValue("agreePrivacy", checked === true, { shouldValidate: true })
                      }
                    />
                    <div className="flex-1">
                      <FieldLabel htmlFor="agreePrivacy" className="text-sm font-normal cursor-pointer">
                        <span className="text-primary font-medium">[필수]</span>{" "}
                        개인정보 처리방침 동의
                      </FieldLabel>
                    </div>
                    <Link
                      href="/privacy"
                      className="text-xs text-muted-foreground hover:text-primary underline"
                    >
                      보기
                    </Link>
                  </Field>

                  <Field
                    orientation="horizontal"
                    className="items-center p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      id="agreeMarketing"
                      checked={agreeMarketing}
                      onCheckedChange={(checked) => setValue("agreeMarketing", checked === true)}
                    />
                    <div className="flex-1">
                      <FieldLabel htmlFor="agreeMarketing" className="text-sm font-normal cursor-pointer">
                        <span className="text-muted-foreground font-medium">[선택]</span>{" "}
                        마케팅 정보 수신 동의
                      </FieldLabel>
                    </div>
                  </Field>
                </div>

                {(errors.agreeTerms || errors.agreePrivacy) && (
                  <p className="text-sm text-destructive -mt-1">
                    필수 약관에 동의해주세요.
                  </p>
                )}

                {/* 회원가입 에러 메시지 */}
                {submitError && (
                  <p className="text-sm text-destructive -mt-1">
                    {submitError}
                  </p>
                )}
              </FieldGroup>
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-8">
              {currentStep > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="flex-1 cursor-pointer"
                  onClick={handlePrevStep}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  이전
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  className="flex-1 cursor-pointer"
                  asChild
                >
                  <Link href="/login" >
                    로그인으로
                  </Link>
                </Button>
              )}

              {currentStep < 3 ? (
                <Button
                  type="button"
                  size="lg"
                  className="flex-1 cursor-pointer"
                  onClick={handleNextStep}
                >
                  다음
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="lg"
                  className="flex-1 cursor-pointer"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      처리 중...
                    </>
                  ) : (
                    <>
                      가입 완료
                      <Check className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Login Link */}
            <div className="text-center mt-6 pt-6 border-t text-sm text-muted-foreground">
              이미 계정이 있으신가요?{" "}
              <Link
                href="/login"
                className="text-primary cursor-pointer font-medium hover:underline"
              >
                로그인
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
