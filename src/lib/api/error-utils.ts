export const TABLE_DELETE_BLOCKED_CODE = "TABLE_007"
export const TABLE_DELETE_BLOCKED_MESSAGE = "미정산 주문이 있어 테이블을 삭제할 수 없습니다"

type ErrorWithCode = Error & { code?: string }

export function getApiErrorCode(error: unknown): string | undefined {
  if (error && typeof error === "object" && "code" in error) {
    return (error as ErrorWithCode).code
  }

  return undefined
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (getApiErrorCode(error) === TABLE_DELETE_BLOCKED_CODE) {
    return TABLE_DELETE_BLOCKED_MESSAGE
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}
