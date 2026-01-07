/**
 * i18n 유틸리티
 */

import { ko, type Translations } from "./locales/ko"
import { vi } from "./locales/vi"

// ================================
// 지원 언어
// ================================

export const locales = {
  ko,
  vi,
} as const

export type Locale = keyof typeof locales

export const defaultLocale: Locale = "ko"

// ================================
// 번역 가져오기
// ================================

export function getTranslations(locale: Locale = defaultLocale): Translations {
  return locales[locale] || locales[defaultLocale]
}

// ================================
// 템플릿 변수 치환
// ================================

export function t(
  template: string,
  variables?: Record<string, string | number>
): string {
  if (!variables) return template
  
  return Object.entries(variables).reduce(
    (result, [key, value]) => result.replace(new RegExp(`{{${key}}}`, "g"), String(value)),
    template
  )
}

// ================================
// 타입 export
// ================================

export type { Translations }
