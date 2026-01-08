import { StaffStatsCards } from "@/components/dashboard/staff/StaffStatsCards"
import { TableOverview } from "@/components/dashboard/staff/TableOverview"

export default function StaffDashboardPage() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <StaffStatsCards />
      <div className="px-4 lg:px-6">
        <TableOverview />
      </div>
    </div>
  )
}
