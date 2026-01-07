/**
 * Zod 유효성 검사 스키마
 * 백엔드 Config API 기반 동적 생성
 */

import { z } from "zod"
import { type ValidationConfig } from "./config"

// ================================
// 에러 메시지 생성 함수
// ================================

export function createErrorMessages(config: ValidationConfig) {
  // 비밀번호 요구사항 메시지 생성
  const pwdRequirements: string[] = []
  if (config.password.requireUppercase) {
    pwdRequirements.push("대문자")
  }
  if (config.password.requireLowercase) {
    pwdRequirements.push("소문자")
  }
  if (config.password.requireNumber) {
    pwdRequirements.push("숫자")
  }
  if (config.password.requireSpecialChar) {
    pwdRequirements.push("특수문자")
  }
  const pwdPatternMsg = pwdRequirements.length > 0
    ? `비밀번호는 ${pwdRequirements.join(", ")}를 포함해야 합니다`
    : "비밀번호 형식이 올바르지 않습니다"

  return {
    name: {
      required: "이름을 입력해주세요",
      minLength: `이름은 ${config.name.minLength}자 이상 입력해주세요`,
      maxLength: `이름은 ${config.name.maxLength}자 이하로 입력해주세요`,
    },
    email: {
      required: "이메일을 입력해주세요",
      invalid: "올바른 이메일 형식이 아닙니다",
      maxLength: `이메일은 ${config.email.maxLength}자 이하로 입력해주세요`,
    },
    phone: {
      required: "전화번호를 입력해주세요",
      invalid: "올바른 전화번호 형식이 아닙니다",
    },
    password: {
      required: "비밀번호를 입력해주세요",
      minLength: `비밀번호는 ${config.password.minLength}자 이상 입력해주세요`,
      maxLength: `비밀번호는 ${config.password.maxLength}자 이하로 입력해주세요`,
      pattern: pwdPatternMsg,
    },
    confirmPassword: {
      required: "비밀번호 확인을 입력해주세요",
      mismatch: "비밀번호가 일치하지 않습니다",
    },
    terms: {
      required: "서비스 이용약관에 동의해주세요",
    },
    privacy: {
      required: "개인정보 처리방침에 동의해주세요",
    },
  } as const
}

// ================================
// 스키마 생성 함수
// ================================

export function createSignupSchema(config: ValidationConfig) {
  const messages = createErrorMessages(config)

  const nameSchema = z
    .string()
    .min(1, messages.name.required)
    .min(config.name.minLength, messages.name.minLength)
    .max(config.name.maxLength, messages.name.maxLength)

  const emailSchema = z
    .string()
    .min(1, messages.email.required)
    .email(messages.email.invalid)
    .max(config.email.maxLength, messages.email.maxLength)

  const phoneSchema = z
    .string()
    .min(1, messages.phone.required)
    .regex(new RegExp(config.phone.pattern), messages.phone.invalid)

  const passwordSchema = z
    .string()
    .min(1, messages.password.required)
    .min(config.password.minLength, messages.password.minLength)
    .max(config.password.maxLength, messages.password.maxLength)
    .regex(new RegExp(config.password.pattern), messages.password.pattern)

  const confirmPasswordSchema = z
    .string()
    .min(1, messages.confirmPassword.required)

  return z
    .object({
      name: nameSchema,
      email: emailSchema,
      phone: phoneSchema,
      password: passwordSchema,
      confirmPassword: confirmPasswordSchema,
      agreeTerms: z.boolean().refine((val) => val === true, {
        message: messages.terms.required,
      }),
      agreePrivacy: z.boolean().refine((val) => val === true, {
        message: messages.privacy.required,
      }),
      agreeMarketing: z.boolean().optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: messages.confirmPassword.mismatch,
      path: ["confirmPassword"],
    })
}

export function createLoginSchema(config: ValidationConfig) {
  const messages = createErrorMessages(config)

  const emailSchema = z
    .string()
    .min(1, messages.email.required)
    .email(messages.email.invalid)
    .max(config.email.maxLength, messages.email.maxLength)

  return z.object({
    email: emailSchema,
    password: z.string().min(1, messages.password.required),
  })
}

// ================================
// 타입 export (스키마 기반)
// ================================

// SignupFormData 타입 (config 필요 없이 사용 가능)
export type SignupFormData = {
  name: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  agreeTerms: boolean
  agreePrivacy: boolean
  agreeMarketing?: boolean
}

export type LoginFormData = {
  email: string
  password: string
}
