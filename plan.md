# TableMaster 프론트엔드 인증 시스템 구현

## 개요

NextAuth.js (Auth.js v5)를 사용한 JWT 기반 인증 시스템 구현.
백엔드 API와 연동하여 토큰 발급, 갱신, 무효화를 처리.

---

## 구현 완료 항목

### 1. 패키지 설치

```bash
npm install next-auth@beta
```

### 2. 파일 구조

```
src/
├── auth.ts                              # NextAuth 메인 설정
├── middleware.ts                        # 라우트 보호 + 역할 기반 리디렉트
├── lib/
│   └── auth/
│       └── types.ts                     # 타입 확장 정의
├── app/
│   ├── layout.tsx                       # SessionProvider + QueryProvider
│   ├── login/
│   │   └── page.tsx                     # Static 로그인 페이지
│   └── api/
│       └── auth/
│           └── [...nextauth]/
│               └── route.ts             # NextAuth API 핸들러
└── components/
    ├── providers/
    │   └── session-provider.tsx         # SessionProvider 래퍼
    ├── login-form.tsx                   # 로그인 폼 (signIn 연동)
    └── session-expired-handler.tsx      # 세션 만료 감지 + 토스트
```

---

## 상세 구현

### 1. `src/auth.ts` - NextAuth 설정

**주요 기능:**
- Credentials Provider (이메일/비밀번호)
- Google, Kakao OAuth (환경변수 설정 시 활성화)
- JWT 토큰 디코딩으로 사용자 정보 추출
- Access Token 만료 5분 전 자동 갱신
- 로그아웃 시 백엔드 API 호출 (Refresh Token 무효화)

**토큰 디코딩:**
```typescript
function decodeJwtPayload(token: string): JwtPayload | null {
  const base64Payload = token.split(".")[1]
  const payload = Buffer.from(base64Payload, "base64").toString("utf-8")
  return JSON.parse(payload)
}
```

**토큰 갱신 로직 (jwt 콜백):**
```typescript
// 만료 5분 전까지는 기존 토큰 사용
const REFRESH_THRESHOLD = 5 * 60 * 1000
if (Date.now() < token.accessTokenExpires - REFRESH_THRESHOLD) {
  return token
}
// 만료 임박 시 갱신
return await refreshAccessToken(token)
```

### 2. `src/middleware.ts` - 라우트 보호

**접근 제어:**
| 경로 | 조건 | 동작 |
|------|------|------|
| `/login`, `/signup` | 이미 로그인됨 | 대시보드로 리디렉트 |
| `/admin/*` | ROLE_ADMIN 필요 | 없으면 `/staff/dashboard`로 |
| `/staff/*` | ROLE_STAFF 필요 | 없으면 `/login`으로 |
| 미인증 | - | `/login`으로 리디렉트 |

### 3. `src/lib/auth/types.ts` - 타입 정의

**백엔드 응답 타입:**
```typescript
interface LoginResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: string
}

interface TokenRefreshResponse {
  accessToken: string
  expiresIn: number
  tokenType: string
}
```

**JWT 페이로드 (디코딩 결과):**
```typescript
interface JwtPayload {
  sub: string        // 사용자 ID
  name: string       // 이름
  email: string      // 이메일
  roles: UserRole[]  // 역할 배열
  iat: number        // 발급 시간
  exp: number        // 만료 시간
}
```

**Session 타입 확장:**
```typescript
interface Session {
  user: {
    id: string
    name: string
    email: string
    roles: UserRole[]
  }
  accessToken: string
  error?: "RefreshTokenError"
}
```

### 4. `src/components/session-expired-handler.tsx`

**동작:**
1. `useSession()` 훅으로 `session.error` 감시
2. `error === "RefreshTokenError"` 감지 시
3. 토스트 표시: "세션이 만료되었습니다"
4. 3초 후 `signOut()` + `/login` 리디렉트

### 5. `src/components/login-form.tsx`

**변경 사항:**
- `"use client"` 클라이언트 컴포넌트
- `signIn("credentials", { ... })` 연동
- `useSearchParams()`로 회원가입 성공 토스트 처리
- 로딩 상태 관리
- Google, Kakao 소셜 로그인 버튼 연결

### 6. `src/app/login/page.tsx`

**Static 페이지로 변경:**
```typescript
import { Suspense } from "react"

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
```

---

## 인증 플로우

### 로그인

```
1. 사용자가 이메일/비밀번호 입력
2. signIn("credentials", { email, password })
3. auth.ts authorize() → POST /api/v1/auth/login
4. 백엔드 응답: { accessToken, refreshToken, expiresIn }
5. JWT 디코딩 → { sub, name, email, roles }
6. NextAuth 세션에 저장
7. 역할 기반 리디렉트 (ROLE_ADMIN → /admin, ROLE_STAFF → /staff)
```

### 토큰 갱신 (자동)

```
1. 매 요청 시 jwt 콜백 실행
2. Access Token 만료 5분 전 체크
3. 5분 이내면 → POST /api/v1/auth/refresh
4. 성공: 새 Access Token으로 세션 업데이트 (사용자 인지 못함)
5. 실패: session.error = "RefreshTokenError"
```

### 로그아웃

```
1. signOut() 호출
2. events.signOut → POST /api/v1/auth/logout
3. 백엔드에서 Refresh Token 무효화
4. 클라이언트 세션 삭제
```

### 세션 만료 (토큰 무효화)

```
1. 백엔드에서 logout-all 또는 블랙리스트 등록
2. 다음 토큰 갱신 시 401 응답
3. session.error = "RefreshTokenError"
4. SessionExpiredHandler 감지
5. 토스트: "세션이 만료되었습니다"
6. 3초 후 로그인 페이지로 리디렉트
```

---

## 환경 변수

```env
# .env.local

# API 설정
NEXT_PUBLIC_API_URL=http://127.0.0.1:8080

# NextAuth 설정 (필수)
AUTH_SECRET=your-secret-key-here  # openssl rand -base64 32

# OAuth (선택)
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_KAKAO_ID=
AUTH_KAKAO_SECRET=
```

---

## 백엔드 API 연동

### 사용하는 엔드포인트

| 메서드 | 엔드포인트 | 용도 |
|--------|-----------|------|
| POST | `/api/v1/auth/login` | 로그인, 토큰 발급 |
| POST | `/api/v1/auth/refresh` | Access Token 갱신 |
| POST | `/api/v1/auth/logout` | 로그아웃, Refresh Token 무효화 |
| POST | `/api/v1/auth/logout-all` | 전체 로그아웃 |

### 요청 헤더

```
Content-Type: application/json
Authorization: Bearer {accessToken}  # logout, logout-all 시
```

### JWT 토큰 구조 (백엔드에서 발급)

```json
{
  "jti": "uuid",
  "sub": "25",
  "email": "user@example.com",
  "name": "홍길동",
  "roles": ["ROLE_STAFF"],
  "type": "access",
  "iat": 1767849631,
  "exp": 1767851431
}
```

---

## 테스트 결과

### 정상 동작 확인

| 테스트 | 결과 |
|--------|------|
| CSRF 토큰 발급 | ✅ 성공 |
| 로그인 (credentials) | ✅ 성공, 302 리디렉트 |
| 세션 조회 | ✅ id, name, email, roles, accessToken |
| 토큰 갱신 | ✅ 새 accessToken 발급 |
| 로그아웃 | ✅ success: true, 세션 null |
| 로그아웃 후 갱신 시도 | ✅ 401 Unauthorized |

### 보안 시나리오 확인

| 시나리오 | 결과 |
|----------|------|
| 잘못된 Refresh Token | ✅ 401 거부 |
| 변조된 토큰 (서명 불일치) | ✅ 401 거부 |
| logout-all 후 갱신 시도 | ✅ 401 거부 |

---

## 주의사항

1. **trustHost 설정**: NextAuth v5에서 localhost 사용 시 `trustHost: true` 필요

2. **Suspense 필수**: `useSearchParams()` 사용 시 Suspense boundary 필요

3. **토큰 갱신 타이밍**: Access Token 만료 5분 전부터 갱신 시도

4. **세션 만료 지연**: logout-all 실행해도 Access Token이 아직 유효하면 세션 유지됨 (만료 5분 전까지)

---

## 추가 구현 예정

- [ ] 비밀번호 변경 페이지 (`POST /api/v1/auth/change-password`)
- [ ] 전체 로그아웃 UI (`POST /api/v1/auth/logout-all`)
- [ ] 설정 페이지 (프로필, 보안 설정)
- [ ] Google/Kakao OAuth 연동 (환경변수 설정 후)
