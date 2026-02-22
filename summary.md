# TableMaster 프로젝트 요약

이 프로젝트는 매장(바, 클럽 등)의 테이블 현황, 입장 고객 관리 및 실시간 채팅 모니터링을 위한 종합 관리 시스템인 **TableMaster**의 프론트엔드 애플리케이션입니다.

## 1. 개요
*   **이름**: TableMaster
*   **목적**: 실시간 테이블 상태 관리, 고객 입장 등록, 성비 및 지역 통계 분석, 그리고 테이블 간 채팅 모니터링 및 관리 기능을 제공합니다.
*   **대상**: 매장 운영진(Admin) 및 스태프(Staff).

## 2. 기술 스택
*   **프레임워크**: Next.js 16.1.1 (App Router), React 19.2.3, TypeScript
*   **스타일링**: Tailwind CSS 4, Framer Motion (애니메이션)
*   **UI 컴포넌트**: Radix UI, Lucide React, Tabler Icons
*   **데이터 관리**: TanStack Query (React Query) v5, React Table v8
*   **폼 & 유효성 검사**: React Hook Form, Zod
*   **인증**: NextAuth.js v5 (Beta)
*   **실시간 통신**: STOMP.js, SockJS (WebSocket)
*   **시각화**: Recharts
*   **다국어 지원**: 한국어(KO), 베트남어(VI) 커스텀 i18n 구현

## 3. 주요 기능

### A. 스태프(Staff) 기능
*   **대시보드**: 실시간 테이블 점유율, 성비, 활성 채팅 수 및 입장 대기 현황 실시간 대시보드.
*   **테이블 관리**: 전체 테이블 상태(이용중/비어있음/예약) 필터링 및 상세 정보 관리.
*   **입장 등록**: 인원, 성비, 지역 정보를 포함한 신규 고객 테이블 배정 시스템.
*   **채팅 모니터링**: 테이블 간 대화 내용을 실시간으로 확인하고 관리.
*   **채팅 관리(Moderation)**: 금칙어 자동 필터링 및 부적절 사용자 제재(경고/뮤트/밴).
*   **통계**: 주간 방문객 추이, 피크 타임, 지역별 분포 통계 차트 제공.

### B. 관리자(Admin) 기능
*   **장치 관리**: 테이블용 하드웨어 장치(Device) 등록, 승인 및 관리.
*   **보안 설정**: 시스템 연동을 위한 시크릿 키(Secret Key) 관리.
*   **전체 통계**: 매장 전체 운영 지표 모니터링.

## 4. 프로젝트 구조
*   `src/app`: 도메인별 라우팅 (admin, staff, auth, (main)).
*   `src/components`: UI 원자 컴포넌트(`ui/`), 도메인별 대시보드 컴포넌트, 공통 레이아웃.
*   `src/hooks`: 비즈니스 로직 캡슐화 (use-tables, use-admin, use-metrics 등).
*   `src/lib`: API 통신 계층(`api/`), WebSocket 클라이언트, i18n locales, 유효성 검사 스키마.
*   `src/fonts`: Kakao Big Sans 폰트 적용.

## 5. 배포 및 설정
*   `Dockerfile` & `nginx.conf`: Nginx를 사용한 컨테이너화 배포 지원.
*   `eslint.config.mjs`: 최신 ESLint 설정을 통한 코드 컨벤션 유지.
