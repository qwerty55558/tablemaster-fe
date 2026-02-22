/**
 * 미들웨어
 * 라우트 보호 및 역할 기반 접근 제어
 */

import { auth } from "@/auth"
import { NextResponse } from "next/server"

// 공개 경로 (인증 불필요)
const PUBLIC_PATHS = ["/login", "/signup", "/forgot-password"]

// 정적 파일 및 API 경로 제외 패턴
const EXCLUDED_PATHS = [
  "/api",
  "/_next",
  "/favicon.ico",
  "/icons",
  "/images",
]

export default auth((req) => {
  const { pathname, origin } = req.nextUrl
  const isLoggedIn = !!req.auth
  const roles = req.auth?.user?.roles || []

  // 정적 파일 및 API 경로 제외
  if (EXCLUDED_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // 공개 경로 처리
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    // 이미 로그인된 사용자가 로그인/회원가입 페이지 접근 시 대시보드로 리디렉트
    if (isLoggedIn) {
      const redirectUrl = roles.includes("ROLE_ADMIN")
        ? "/admin/dashboard"
        : "/staff/dashboard"
      return NextResponse.redirect(new URL(redirectUrl, origin))
    }
    return NextResponse.next()
  }

  // 메인 페이지 (/) - 로그인된 사용자는 역할에 맞는 대시보드로 리디렉트
  if (pathname === "/") {
    if (isLoggedIn) {
      const redirectUrl = roles.includes("ROLE_ADMIN")
        ? "/admin/dashboard"
        : "/staff/dashboard"
      return NextResponse.redirect(new URL(redirectUrl, origin))
    }
    return NextResponse.next()
  }

  // 미인증 사용자 → 로그인 페이지로 리디렉트
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", origin)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 역할 기반 접근 제어
  // /admin/* 경로: ROLE_ADMIN 필요
  if (pathname.startsWith("/admin")) {
    if (!roles.includes("ROLE_ADMIN")) {
      // 권한 없으면 staff 대시보드로 리디렉트
      return NextResponse.redirect(new URL("/staff/dashboard", origin))
    }
  }

  // /staff/* 경로: ROLE_STAFF 또는 ROLE_ADMIN 필요
  if (pathname.startsWith("/staff")) {
    if (!roles.includes("ROLE_STAFF") && !roles.includes("ROLE_ADMIN")) {
      // 권한 없으면 로그인 페이지로 리디렉트
      return NextResponse.redirect(new URL("/login", origin))
    }
  }

  return NextResponse.next()
})


export const config = {
  matcher: [
    /*
     * 다음 경로를 제외한 모든 요청에 미들웨어 적용:
     * - api (API 라우트)
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화 파일)
     * - favicon.ico (파비콘)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
