/**
 * Grafana 메트릭 API 클라이언트
 * 
 * Grafana API 엔드포인트:
 * - /api/dashboards - 대시보드 조회
 * - /api/ds/query - 데이터소스 쿼리
 */

// 환경 변수에서 API URL 가져오기
const GRAFANA_API_URL = process.env.NEXT_PUBLIC_GRAFANA_URL || "http://localhost:3001"
const GRAFANA_API_KEY = process.env.NEXT_PUBLIC_GRAFANA_API_KEY || ""

// ================================
// 타입 정의
// ================================

export interface GrafanaQueryResponse {
  results: Record<string, GrafanaQueryResult>
}

export interface GrafanaQueryResult {
  status: number
  frames: GrafanaDataFrame[]
  error?: string
}

export interface GrafanaDataFrame {
  schema: {
    name: string
    fields: Array<{
      name: string
      type: string
      labels?: Record<string, string>
    }>
  }
  data: {
    values: Array<Array<number | string>>
  }
}

export interface DashboardMetrics {
  totalUsers: number
  totalUsersChange: number
  activeStaff: number
  activeStaffOnline: number
  systemHealth: number
  systemHealthStatus: "stable" | "warning" | "critical"
  pendingApprovals: number
  pendingApprovalsChange: number
}

export interface StaffMetrics {
  myTasks: number
  tasksDueToday: number
  completedTasks: number
  completedTasksChange: number
  hoursLogged: number
  weeklyTarget: number
  upcomingEvents: number
  nextEventName: string
}

export interface TimeSeriesData {
  timestamp: number
  value: number
}

export interface SystemMetrics {
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
  networkIn: number
  networkOut: number
  requestsPerSecond: number
  errorRate: number
  responseTime: number
}

// ================================
// Grafana API 클라이언트
// ================================

class GrafanaApiClient {
  private baseUrl: string
  private apiKey: string

  constructor() {
    this.baseUrl = GRAFANA_API_URL
    this.apiKey = GRAFANA_API_KEY
  }

  private getHeaders(): HeadersInit {
    return {
      "Accept": "application/json",
      "Content-Type": "application/json",
      ...(this.apiKey && { "Authorization": `Bearer ${this.apiKey}` }),
    }
  }

  /**
   * Grafana 데이터소스 쿼리 실행
   */
  async query(
    datasourceUid: string,
    queries: Array<{ refId: string; expr?: string; rawSql?: string }>,
    from: number = Date.now() - 3600000,
    to: number = Date.now()
  ): Promise<GrafanaQueryResponse> {
    const response = await fetch(`${this.baseUrl}/api/ds/query`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        queries: queries.map((q) => ({
          ...q,
          datasourceId: datasourceUid,
          intervalMs: 60000,
          maxDataPoints: 100,
        })),
        from: from.toString(),
        to: to.toString(),
      }),
    })

    if (!response.ok) {
      throw new Error(`Grafana query failed: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * 대시보드 메트릭 조회 (특정 대시보드 패널에서)
   */
  async getDashboardPanelData(
    dashboardUid: string,
    panelId: number
  ): Promise<GrafanaDataFrame[]> {
    const response = await fetch(
      `${this.baseUrl}/api/dashboards/uid/${dashboardUid}/panels/${panelId}/data`,
      {
        headers: this.getHeaders(),
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to get panel data: ${response.statusText}`)
    }

    const data = await response.json()
    return data.frames || []
  }

  /**
   * 단일 값 추출 (첫 번째 프레임의 마지막 값)
   */
  extractValue(frames: GrafanaDataFrame[]): number {
    if (!frames.length || !frames[0].data.values.length) return 0
    const values = frames[0].data.values[1] // 보통 [timestamp, value] 구조
    if (!values || !values.length) return 0
    return Number(values[values.length - 1]) || 0
  }

  /**
   * 시계열 데이터 추출
   */
  extractTimeSeries(frames: GrafanaDataFrame[]): TimeSeriesData[] {
    if (!frames.length || !frames[0].data.values.length) return []
    
    const timestamps = frames[0].data.values[0] as number[]
    const values = frames[0].data.values[1] as number[]
    
    return timestamps.map((ts, i) => ({
      timestamp: ts,
      value: values[i] || 0,
    }))
  }
}

export const grafanaApi = new GrafanaApiClient()

// ================================
// 대시보드 메트릭 Fetcher 함수들
// ================================

/**
 * 관리자 대시보드 메트릭 조회
 */
export async function fetchAdminDashboardMetrics(): Promise<DashboardMetrics> {
  try {
    // Grafana API를 통해 대시보드 데이터 조회
    // 실제 구현 시 대시보드 UID와 패널 ID를 설정해야 함
    const response = await grafanaApi.query(
      "your-datasource-uid", // 데이터소스 UID
      [
        { refId: "A", rawSql: "SELECT COUNT(*) as total_users FROM users" },
        { refId: "B", rawSql: "SELECT COUNT(*) as active_staff FROM staff WHERE status = 'active'" },
        // 추가 쿼리...
      ]
    )

    // 응답 파싱 (실제 구현에 맞게 수정 필요)
    const results = response.results

    return {
      totalUsers: grafanaApi.extractValue(results.A?.frames || []),
      totalUsersChange: 8.2,
      activeStaff: grafanaApi.extractValue(results.B?.frames || []),
      activeStaffOnline: 32,
      systemHealth: 99.9,
      systemHealthStatus: "stable",
      pendingApprovals: 23,
      pendingApprovalsChange: -15,
    }
  } catch (error) {
    console.error("Failed to fetch admin dashboard metrics:", error)
    // 폴백 데이터 (개발 환경용)
    return {
      totalUsers: 12458,
      totalUsersChange: 8.2,
      activeStaff: 48,
      activeStaffOnline: 32,
      systemHealth: 99.9,
      systemHealthStatus: "stable",
      pendingApprovals: 23,
      pendingApprovalsChange: -15,
    }
  }
}

/**
 * 스태프 대시보드 메트릭 조회
 */
export async function fetchStaffDashboardMetrics(userId?: string): Promise<StaffMetrics> {
  try {
    const userFilter = userId ? `WHERE user_id = '${userId}'` : ""
    
    const response = await grafanaApi.query(
      "your-datasource-uid",
      [
        { refId: "A", rawSql: `SELECT COUNT(*) as my_tasks FROM tasks ${userFilter} AND status = 'active'` },
        { refId: "B", rawSql: `SELECT COUNT(*) as completed FROM tasks ${userFilter} AND status = 'completed'` },
        // 추가 쿼리...
      ]
    )

    const results = response.results

    return {
      myTasks: grafanaApi.extractValue(results.A?.frames || []),
      tasksDueToday: 5,
      completedTasks: grafanaApi.extractValue(results.B?.frames || []),
      completedTasksChange: 12,
      hoursLogged: 32.5,
      weeklyTarget: 40,
      upcomingEvents: 3,
      nextEventName: "Team meeting at 2PM",
    }
  } catch (error) {
    console.error("Failed to fetch staff dashboard metrics:", error)
    // 폴백 데이터
    return {
      myTasks: 12,
      tasksDueToday: 5,
      completedTasks: 28,
      completedTasksChange: 12,
      hoursLogged: 32.5,
      weeklyTarget: 40,
      upcomingEvents: 3,
      nextEventName: "Team meeting at 2PM",
    }
  }
}

/**
 * 시스템 메트릭 조회 (모니터링 대시보드용)
 */
export async function fetchSystemMetrics(): Promise<SystemMetrics> {
  try {
    // Grafana에서 시스템 모니터링 대시보드 데이터 조회
    const response = await grafanaApi.query(
      "your-datasource-uid",
      [
        { refId: "cpu", rawSql: "SELECT avg(cpu_usage) FROM system_metrics WHERE time > now() - 5m" },
        { refId: "memory", rawSql: "SELECT avg(memory_usage) FROM system_metrics WHERE time > now() - 5m" },
        // 추가 쿼리...
      ]
    )

    const results = response.results

    return {
      cpuUsage: grafanaApi.extractValue(results.cpu?.frames || []),
      memoryUsage: grafanaApi.extractValue(results.memory?.frames || []),
      diskUsage: 34.5,
      networkIn: 1024000,
      networkOut: 512000,
      requestsPerSecond: 156.32,
      errorRate: 0.02,
      responseTime: 45,
    }
  } catch (error) {
    console.error("Failed to fetch system metrics:", error)
    return {
      cpuUsage: 45.2,
      memoryUsage: 62.8,
      diskUsage: 34.5,
      networkIn: 1024000,
      networkOut: 512000,
      requestsPerSecond: 156.32,
      errorRate: 0.02,
      responseTime: 45,
    }
  }
}

/**
 * 시계열 메트릭 조회 (차트용)
 */
export async function fetchMetricsTimeSeries(
  query: string,
  duration: string = "24h"
): Promise<TimeSeriesData[]> {
  try {
    const durationMs = parseDuration(duration)
    const to = Date.now()
    const from = to - durationMs
    
    const response = await grafanaApi.query(
      "your-datasource-uid",
      [{ refId: "A", rawSql: query }],
      from,
      to
    )

    return grafanaApi.extractTimeSeries(response.results.A?.frames || [])
  } catch (error) {
    console.error("Failed to fetch time series metrics:", error)
    return []
  }
}

// 헬퍼 함수: 기간 문자열을 밀리초로 변환
function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([hdwm])$/)
  if (!match) return 86400000 // 기본값: 24시간

  const value = parseInt(match[1], 10)
  const unit = match[2]

  switch (unit) {
    case "h": return value * 3600000
    case "d": return value * 86400000
    case "w": return value * 604800000
    case "m": return value * 2592000000
    default: return 86400000
  }
}
