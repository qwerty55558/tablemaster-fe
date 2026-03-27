"use client"

import { useState } from "react"
import {
  IconCheck,
  IconEdit,
  IconEye,
  IconFilter,
  IconLoader2,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconTrash,
  IconX,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  sanctionChatRoom,
  type SanctionType,
} from "@/lib/api/chat"
import {
  type ChatReport,
  type ForbiddenWord,
  type ModerationAction,
} from "@/lib/api/chat-moderation"
import {
  useCreateForbiddenWord,
  useDeleteForbiddenWord,
  useForbiddenWords,
  useModerationHistories,
  useModerationHistoryDetail,
  usePendingReports,
  useReviewChatReport,
  useUpdateForbiddenWord,
} from "@/hooks/use-chat-moderation"
import { cn } from "@/lib/utils"

type HistoryFilterAction = "all" | ModerationAction

const actionLabels: Record<ModerationAction, string> = {
  WARNING: "경고",
  MUTE: "음소거",
  BAN: "밴",
  SANCTION_LIFTED: "제재 해제",
  REPORT_APPROVED: "신고 승인",
  REPORT_REJECTED: "신고 반려",
}

const actionStyles: Record<ModerationAction, string> = {
  WARNING: "bg-amber-500/15 text-amber-700 border-amber-200",
  MUTE: "bg-orange-500/15 text-orange-700 border-orange-200",
  BAN: "bg-red-500/15 text-red-700 border-red-200",
  SANCTION_LIFTED: "bg-emerald-500/15 text-emerald-700 border-emerald-200",
  REPORT_APPROVED: "bg-sky-500/15 text-sky-700 border-sky-200",
  REPORT_REJECTED: "bg-slate-500/15 text-slate-700 border-slate-200",
}

function formatDateTime(dateString?: string | null) {
  if (!dateString) return "-"

  return new Date(dateString).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

function formatRelative(dateString?: string | null) {
  if (!dateString) return "-"

  const now = Date.now()
  const diffMinutes = Math.max(
    0,
    Math.floor((now - new Date(dateString).getTime()) / 60000)
  )

  if (diffMinutes < 1) return "방금 전"
  if (diffMinutes < 60) return `${diffMinutes}분 전`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}시간 전`

  return `${Math.floor(diffHours / 24)}일 전`
}

function prettyPayload(payload?: string | null) {
  if (!payload) return "-"

  try {
    return JSON.stringify(JSON.parse(payload), null, 2)
  } catch {
    return payload
  }
}

export default function ModerationPage() {
  const [activeTab, setActiveTab] = useState("reports")
  const [historySearchQuery, setHistorySearchQuery] = useState("")
  const [historyFilterAction, setHistoryFilterAction] =
    useState<HistoryFilterAction>("all")
  const [forbiddenSearchQuery, setForbiddenSearchQuery] = useState("")
  const [forbiddenDialogOpen, setForbiddenDialogOpen] = useState(false)
  const [historyDetailOpen, setHistoryDetailOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false)
  const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null)
  const [editingWord, setEditingWord] = useState<ForbiddenWord | null>(null)
  const [reportToApprove, setReportToApprove] = useState<ChatReport | null>(null)
  const [wordForm, setWordForm] = useState({
    word: "",
    reason: "",
    isActive: true,
  })
  const [approvalForm, setApprovalForm] = useState({
    type: "WARNING" as SanctionType,
    reason: "",
    durationMode: "permanent",
    customMinutes: "",
  })
  const [wordFormError, setWordFormError] = useState("")
  const [approvalFormError, setApprovalFormError] = useState("")
  const [wordToDelete, setWordToDelete] = useState<ForbiddenWord | null>(null)

  const historiesQuery = useModerationHistories()
  const historyDetailQuery = useModerationHistoryDetail(
    historyDetailOpen ? selectedHistoryId : null
  )
  const pendingReportsQuery = usePendingReports()
  const forbiddenWordsQuery = useForbiddenWords()

  const reviewReportMutation = useReviewChatReport()
  const createForbiddenWordMutation = useCreateForbiddenWord()
  const updateForbiddenWordMutation = useUpdateForbiddenWord()
  const deleteForbiddenWordMutation = useDeleteForbiddenWord()

  const histories = historiesQuery.data || []
  const pendingReports = pendingReportsQuery.data || []
  const forbiddenWords = forbiddenWordsQuery.data || []

  const filteredHistories = histories.filter((history) => {
    const keyword = historySearchQuery.trim().toLowerCase()
    const matchesSearch =
      keyword.length === 0 ||
      history.tableNames.toLowerCase().includes(keyword) ||
      (history.reason || "").toLowerCase().includes(keyword) ||
      (history.processedBy || "").toLowerCase().includes(keyword)

    const matchesAction =
      historyFilterAction === "all" || history.action === historyFilterAction

    return matchesSearch && matchesAction
  })

  const filteredForbiddenWords = forbiddenWords.filter((item) => {
    const keyword = forbiddenSearchQuery.trim().toLowerCase()
    if (!keyword) return true

    return (
      item.word.toLowerCase().includes(keyword) ||
      (item.reason || "").toLowerCase().includes(keyword) ||
      (item.createdByName || "").toLowerCase().includes(keyword)
    )
  })

  const activeForbiddenWordCount = forbiddenWords.filter((item) => item.isActive).length
  const reportReviewPending = reviewReportMutation.isPending
  const forbiddenWordMutationPending =
    createForbiddenWordMutation.isPending ||
    updateForbiddenWordMutation.isPending ||
    deleteForbiddenWordMutation.isPending
  const approvalPending = reportReviewPending

  const openCreateWordDialog = () => {
    setEditingWord(null)
    setWordFormError("")
    setWordForm({
      word: "",
      reason: "",
      isActive: true,
    })
    setForbiddenDialogOpen(true)
  }

  const openApprovalDialog = (report: ChatReport) => {
    setReportToApprove(report)
    setApprovalFormError("")
    setApprovalForm({
      type: "WARNING",
      reason: report.reason,
      durationMode: "permanent",
      customMinutes: "",
    })
    setApprovalDialogOpen(true)
  }

  const openEditWordDialog = (word: ForbiddenWord) => {
    setEditingWord(word)
    setWordFormError("")
    setWordForm({
      word: word.word,
      reason: word.reason || "",
      isActive: word.isActive,
    })
    setForbiddenDialogOpen(true)
  }

  const handleSubmitWord = async () => {
    const nextWord = wordForm.word.trim()
    const nextReason = wordForm.reason.trim()

    if (!nextWord) {
      setWordFormError("금칙어를 입력하세요.")
      return
    }

    try {
      if (editingWord) {
        await updateForbiddenWordMutation.mutateAsync({
          id: editingWord.id,
          data: {
            word: nextWord,
            reason: nextReason || undefined,
            isActive: wordForm.isActive,
          },
        })
        toast.success("금칙어를 수정했습니다.")
      } else {
        await createForbiddenWordMutation.mutateAsync({
          word: nextWord,
          reason: nextReason || undefined,
        })
        toast.success("금칙어를 추가했습니다.")
      }

      setWordFormError("")
      setForbiddenDialogOpen(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : "처리에 실패했습니다."
      toast.error(message)
    }
  }

  const handleToggleForbiddenWord = async (word: ForbiddenWord, isActive: boolean) => {
    try {
      await updateForbiddenWordMutation.mutateAsync({
        id: word.id,
        data: {
          word: word.word,
          reason: word.reason || undefined,
          isActive,
        },
      })
      toast.success(isActive ? "금칙어를 활성화했습니다." : "금칙어를 비활성화했습니다.")
    } catch (error) {
      const message = error instanceof Error ? error.message : "처리에 실패했습니다."
      toast.error(message)
    }
  }

  const handleDeleteForbiddenWord = async () => {
    if (!wordToDelete) return

    try {
      await deleteForbiddenWordMutation.mutateAsync(wordToDelete.id)
      toast.success("금칙어를 삭제했습니다.")
      setDeleteDialogOpen(false)
      setWordToDelete(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : "삭제에 실패했습니다."
      toast.error(message)
    }
  }

  const handleReviewReport = async (
    reportId: number,
    status: "REVIEWED" | "DISMISSED"
  ) => {
    try {
      await reviewReportMutation.mutateAsync({ reportId, status })
      toast.success(status === "REVIEWED" ? "신고를 승인했습니다." : "신고를 반려했습니다.")
    } catch (error) {
      const message = error instanceof Error ? error.message : "처리에 실패했습니다."
      toast.error(message)
    }
  }

  const handleApproveWithSanction = async () => {
    if (!reportToApprove) return

    const trimmedReason = approvalForm.reason.trim()
    let durationMinutes: number | undefined

    if (approvalForm.type === "BAN") {
      if (approvalForm.durationMode === "custom") {
        const parsedMinutes = Number.parseInt(approvalForm.customMinutes, 10)
        if (!Number.isFinite(parsedMinutes) || parsedMinutes <= 0) {
          setApprovalFormError("유효한 제재 시간을 입력하세요.")
          return
        }
        durationMinutes = parsedMinutes
      } else if (approvalForm.durationMode !== "permanent") {
        durationMinutes = Number.parseInt(approvalForm.durationMode, 10)
      }
    }

    try {
      setApprovalFormError("")

      await sanctionChatRoom(reportToApprove.chatRoomId, {
        type: approvalForm.type,
        reason: trimmedReason || undefined,
        durationMinutes,
      })

      await reviewReportMutation.mutateAsync({
        reportId: reportToApprove.id,
        status: "REVIEWED",
      })

      toast.success("신고 승인과 제재 적용을 완료했습니다.")
      setApprovalDialogOpen(false)
      setReportToApprove(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : "처리에 실패했습니다."
      toast.error(message)
    }
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>대기 중 신고</CardDescription>
              <CardTitle className="text-3xl">{pendingReports.length}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground">
              승인 또는 반려가 필요한 채팅 신고 건수
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>활성 금칙어</CardDescription>
              <CardTitle className="text-3xl">{activeForbiddenWordCount}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground">
              채팅 전송 차단에 반영되는 금칙어 수
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>누적 제재 이력</CardDescription>
              <CardTitle className="text-3xl">{histories.length}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground">
              경고, 음소거, 밴, 신고 처리 이력 포함
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <TabsList>
              <TabsTrigger value="reports">신고 대기</TabsTrigger>
              <TabsTrigger value="forbidden">금칙어 관리</TabsTrigger>
              <TabsTrigger value="histories">제재 이력</TabsTrigger>
            </TabsList>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                pendingReportsQuery.refetch()
                forbiddenWordsQuery.refetch()
                historiesQuery.refetch()
              }}
            >
              <IconRefresh className="size-4" />
              새로고침
            </Button>
          </div>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>신고 검토 대기</CardTitle>
                <CardDescription>
                  PENDING 상태 신고를 승인 또는 반려합니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingReportsQuery.isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <IconLoader2 className="size-5 animate-spin text-muted-foreground" />
                  </div>
                ) : pendingReportsQuery.error ? (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                    {pendingReportsQuery.error.message}
                  </div>
                ) : pendingReports.length === 0 ? (
                  <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
                    검토 대기 중인 신고가 없습니다.
                  </div>
                ) : (
                  <Table className="table-fixed">
                    <TableHeader>
                      <TableRow>
                        <TableHead>신고 ID</TableHead>
                        <TableHead>채팅방</TableHead>
                        <TableHead>신고자</TableHead>
                        <TableHead>피신고자</TableHead>
                        <TableHead>사유</TableHead>
                        <TableHead>접수 시각</TableHead>
                        <TableHead className="text-right">처리</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingReports.map((report) => (
                        <TableRow key={report.id} className="align-top">
                          <TableCell className="font-medium">#{report.id}</TableCell>
                          <TableCell>방 {report.chatRoomId}</TableCell>
                          <TableCell className="break-all whitespace-normal">
                            {report.reporterTableName}
                          </TableCell>
                          <TableCell className="break-all whitespace-normal">
                            {report.reportedTableName}
                          </TableCell>
                          <TableCell className="max-w-[280px] break-all whitespace-normal">
                            {report.reason}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-muted-foreground">
                            <div>{formatDateTime(report.createdAt)}</div>
                            <div className="text-xs">{formatRelative(report.createdAt)}</div>
                          </TableCell>
                          <TableCell className="w-[140px] text-right">
                            <div className="flex flex-col items-end gap-2">
                              <Button
                                size="sm"
                                disabled={reportReviewPending}
                                onClick={() => openApprovalDialog(report)}
                              >
                                <IconCheck className="size-4" />
                                승인
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={reportReviewPending}
                                onClick={() => handleReviewReport(report.id, "DISMISSED")}
                              >
                                <IconX className="size-4" />
                                반려
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="forbidden">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>금칙어 관리</CardTitle>
                    <CardDescription>
                      채팅 전송 전에 차단되는 단어를 관리합니다.
                    </CardDescription>
                  </div>
                  <Button onClick={openCreateWordDialog}>
                    <IconPlus className="size-4" />
                    금칙어 추가
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative max-w-sm">
                  <IconSearch className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    placeholder="금칙어, 사유, 등록자 검색"
                    className="pl-8"
                    value={forbiddenSearchQuery}
                    onChange={(e) => setForbiddenSearchQuery(e.target.value)}
                  />
                </div>

                {forbiddenWordsQuery.isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <IconLoader2 className="size-5 animate-spin text-muted-foreground" />
                  </div>
                ) : forbiddenWordsQuery.error ? (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                    {forbiddenWordsQuery.error.message}
                  </div>
                ) : filteredForbiddenWords.length === 0 ? (
                  <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
                    등록된 금칙어가 없습니다.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>단어</TableHead>
                        <TableHead>사유</TableHead>
                        <TableHead>상태</TableHead>
                        <TableHead>등록자</TableHead>
                        <TableHead>수정일</TableHead>
                        <TableHead className="text-right">관리</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredForbiddenWords.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.word}</TableCell>
                          <TableCell className="max-w-[260px] whitespace-normal break-words">
                            {item.reason || "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Badge variant={item.isActive ? "default" : "secondary"}>
                                {item.isActive ? "활성" : "비활성"}
                              </Badge>
                              <Switch
                                checked={item.isActive}
                                disabled={forbiddenWordMutationPending}
                                onCheckedChange={(checked) =>
                                  handleToggleForbiddenWord(item, checked)
                                }
                              />
                            </div>
                          </TableCell>
                          <TableCell>{item.createdByName || "-"}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDateTime(item.updatedAt || item.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                onClick={() => openEditWordDialog(item)}
                              >
                                <IconEdit className="size-4" />
                              </Button>
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                className="text-destructive"
                                onClick={() => {
                                  setWordToDelete(item)
                                  setDeleteDialogOpen(true)
                                }}
                              >
                                <IconTrash className="size-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="histories">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <CardTitle>제재 이력</CardTitle>
                    <CardDescription>
                      조치 유형과 처리자, 상세 payload까지 조회합니다.
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative">
                      <IconSearch className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                      <Input
                        placeholder="테이블, 사유, 처리자 검색"
                        className="w-full pl-8 sm:w-[260px]"
                        value={historySearchQuery}
                        onChange={(e) => setHistorySearchQuery(e.target.value)}
                      />
                    </div>
                    <Select
                      value={historyFilterAction}
                      onValueChange={(value) =>
                        setHistoryFilterAction(value as HistoryFilterAction)
                      }
                    >
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <IconFilter className="size-4" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체 조치</SelectItem>
                        {Object.entries(actionLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {historiesQuery.isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <IconLoader2 className="size-5 animate-spin text-muted-foreground" />
                  </div>
                ) : historiesQuery.error ? (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                    {historiesQuery.error.message}
                  </div>
                ) : filteredHistories.length === 0 ? (
                  <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
                    조건에 맞는 이력이 없습니다.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>테이블</TableHead>
                        <TableHead>사유</TableHead>
                        <TableHead>조치</TableHead>
                        <TableHead>처리일시</TableHead>
                        <TableHead>처리자</TableHead>
                        <TableHead className="text-right">상세</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredHistories.map((history) => (
                        <TableRow key={history.id}>
                          <TableCell className="font-medium">
                            {history.tableNames}
                          </TableCell>
                          <TableCell className="max-w-[280px] whitespace-normal break-words">
                            {history.reason || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn("font-normal", actionStyles[history.action])}
                            >
                              {actionLabels[history.action]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDateTime(history.processedAt)}
                          </TableCell>
                          <TableCell>{history.processedBy || "-"}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => {
                                setSelectedHistoryId(history.id)
                                setHistoryDetailOpen(true)
                              }}
                            >
                              <IconEye className="size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog
        open={forbiddenDialogOpen}
        onOpenChange={(open) => {
          setForbiddenDialogOpen(open)
          if (!open) {
            setWordFormError("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingWord ? "금칙어 수정" : "금칙어 추가"}
            </DialogTitle>
            <DialogDescription>
              등록된 금칙어는 채팅 전송 전에 검사됩니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="word">금칙어</Label>
              <Input
                id="word"
                value={wordForm.word}
                onChange={(e) => {
                  setWordForm((prev) => ({ ...prev, word: e.target.value }))
                  if (wordFormError) setWordFormError("")
                }}
                placeholder="예: 연락처유도"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">사유</Label>
              <Input
                id="reason"
                value={wordForm.reason}
                onChange={(e) =>
                  setWordForm((prev) => ({ ...prev, reason: e.target.value }))
                }
                placeholder="예: 개인정보 교환 유도 차단"
              />
            </div>

            {editingWord && (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">활성 상태</p>
                  <p className="text-xs text-muted-foreground">
                    비활성화하면 차단 검사에서 제외됩니다.
                  </p>
                </div>
                <Switch
                  checked={wordForm.isActive}
                  onCheckedChange={(checked) =>
                    setWordForm((prev) => ({ ...prev, isActive: checked }))
                  }
                />
              </div>
            )}

            {wordFormError && (
              <p className="text-sm text-destructive">{wordFormError}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setForbiddenDialogOpen(false)}
              disabled={forbiddenWordMutationPending}
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={handleSubmitWord}
              disabled={forbiddenWordMutationPending}
            >
              {forbiddenWordMutationPending ? "처리 중..." : editingWord ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={historyDetailOpen} onOpenChange={setHistoryDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>제재 이력 상세</DialogTitle>
            <DialogDescription>
              처리 메타데이터와 원본 payload를 함께 확인합니다.
            </DialogDescription>
          </DialogHeader>

          {historyDetailQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <IconLoader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : historyDetailQuery.error ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
              {historyDetailQuery.error.message}
            </div>
          ) : historyDetailQuery.data ? (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">조치</p>
                  <p className="mt-1 font-medium">
                    {actionLabels[historyDetailQuery.data.action]}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">처리일시</p>
                  <p className="mt-1 font-medium">
                    {formatDateTime(historyDetailQuery.data.processedAt)}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">채팅방 ID</p>
                  <p className="mt-1 font-medium">
                    {historyDetailQuery.data.chatRoomId ?? "-"}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">신고 ID</p>
                  <p className="mt-1 font-medium">
                    {historyDetailQuery.data.reportId ?? "-"}
                  </p>
                </div>
                <div className="rounded-lg border p-3 sm:col-span-2">
                  <p className="text-xs text-muted-foreground">테이블</p>
                  <p className="mt-1 font-medium">
                    {historyDetailQuery.data.tableNames}
                  </p>
                </div>
                <div className="rounded-lg border p-3 sm:col-span-2">
                  <p className="text-xs text-muted-foreground">사유</p>
                  <p className="mt-1 font-medium">
                    {historyDetailQuery.data.reason || "-"}
                  </p>
                </div>
                <div className="rounded-lg border p-3 sm:col-span-2">
                  <p className="text-xs text-muted-foreground">상세 조치</p>
                  <p className="mt-1 font-medium">
                    {historyDetailQuery.data.actionDetail || "-"}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">처리자</p>
                  <p className="mt-1 font-medium">
                    {historyDetailQuery.data.processedBy || "-"}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">처리자 ID</p>
                  <p className="mt-1 font-medium">
                    {historyDetailQuery.data.processedByUserId ?? "-"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Payload</Label>
                <pre className="max-h-80 overflow-auto rounded-lg border bg-muted/40 p-3 text-xs leading-5 whitespace-pre-wrap break-all">
                  {prettyPayload(historyDetailQuery.data.payload)}
                </pre>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={approvalDialogOpen}
        onOpenChange={(open) => {
          setApprovalDialogOpen(open)
          if (!open) {
            setApprovalFormError("")
            setReportToApprove(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>신고 승인 및 제재 적용</DialogTitle>
            <DialogDescription>
              신고를 승인하면서 즉시 제재를 적용합니다.
            </DialogDescription>
          </DialogHeader>

          {reportToApprove && (
            <div className="space-y-4">
              <div className="rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">채팅방</span>
                  <span className="font-medium">방 {reportToApprove.chatRoomId}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">피신고자</span>
                  <span className="break-all text-right font-medium">
                    {reportToApprove.reportedTableName}
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-muted-foreground">신고 사유</p>
                  <p className="mt-1 break-all">{reportToApprove.reason}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>제재 유형</Label>
                <Select
                  value={approvalForm.type}
                  onValueChange={(value) =>
                    setApprovalForm((prev) => ({
                      ...prev,
                      type: value as SanctionType,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WARNING">경고</SelectItem>
                    <SelectItem value="MUTE">음소거</SelectItem>
                    <SelectItem value="BAN">밴</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="approval-reason">제재 사유</Label>
                <Input
                  id="approval-reason"
                  value={approvalForm.reason}
                  onChange={(e) =>
                    setApprovalForm((prev) => ({
                      ...prev,
                      reason: e.target.value,
                    }))
                  }
                  placeholder="제재 사유를 입력하세요"
                />
              </div>

              {approvalForm.type === "BAN" && (
                <div className="space-y-2">
                  <Label>제재 기간</Label>
                  <Select
                    value={approvalForm.durationMode}
                    onValueChange={(value) =>
                      setApprovalForm((prev) => ({
                        ...prev,
                        durationMode: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="permanent">영구</SelectItem>
                      <SelectItem value="60">1시간</SelectItem>
                      <SelectItem value="1440">1일</SelectItem>
                      <SelectItem value="10080">7일</SelectItem>
                      <SelectItem value="custom">직접 입력</SelectItem>
                    </SelectContent>
                  </Select>

                  {approvalForm.durationMode === "custom" && (
                    <Input
                      inputMode="numeric"
                      value={approvalForm.customMinutes}
                      onChange={(e) =>
                        setApprovalForm((prev) => ({
                          ...prev,
                          customMinutes: e.target.value,
                        }))
                      }
                      placeholder="분 단위 입력"
                    />
                  )}
                </div>
              )}

              {approvalForm.type === "MUTE" && (
                <p className="text-xs text-muted-foreground">
                  음소거는 피신고 디바이스에 바로 적용됩니다.
                </p>
              )}

              {approvalFormError && (
                <p className="text-sm text-destructive">{approvalFormError}</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setApprovalDialogOpen(false)}
              disabled={approvalPending}
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={handleApproveWithSanction}
              disabled={approvalPending || !reportToApprove}
            >
              {approvalPending ? "처리 중..." : "승인 후 제재 적용"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>금칙어를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              {wordToDelete ? `삭제 대상: ${wordToDelete.word}` : "삭제할 금칙어를 선택하세요."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteDialogOpen(false)
                setWordToDelete(null)
              }}
            >
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteForbiddenWord}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
