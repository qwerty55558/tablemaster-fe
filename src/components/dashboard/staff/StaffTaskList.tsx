"use client"

import { IconCircleCheck, IconCircleDashed, IconClock } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const tasks = [
  {
    id: 1,
    title: "Review project documentation",
    status: "in_progress",
    priority: "high",
    dueDate: "Today",
  },
  {
    id: 2,
    title: "Update client report",
    status: "pending",
    priority: "medium",
    dueDate: "Tomorrow",
  },
  {
    id: 3,
    title: "Team meeting preparation",
    status: "completed",
    priority: "low",
    dueDate: "Today",
  },
  {
    id: 4,
    title: "Database backup verification",
    status: "pending",
    priority: "high",
    dueDate: "Jan 8",
  },
  {
    id: 5,
    title: "Code review for feature branch",
    status: "in_progress",
    priority: "medium",
    dueDate: "Jan 9",
  },
]

const statusIcons = {
  pending: <IconCircleDashed className="size-4 text-muted-foreground" />,
  in_progress: <IconClock className="size-4 text-yellow-500" />,
  completed: <IconCircleCheck className="size-4 text-green-500" />,
}

const priorityColors = {
  high: "destructive",
  medium: "secondary",
  low: "outline",
} as const

export function StaffTaskList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Tasks</CardTitle>
        <CardDescription>Your assigned tasks and their status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="flex items-center gap-3">
                {statusIcons[task.status as keyof typeof statusIcons]}
                <div>
                  <p className="font-medium">{task.title}</p>
                  <p className="text-sm text-muted-foreground">
                    Due: {task.dueDate}
                  </p>
                </div>
              </div>
              <Badge variant={priorityColors[task.priority as keyof typeof priorityColors]}>
                {task.priority}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
