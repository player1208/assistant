import PlanningOverview from '../../features/planning/components/Overview'
import ScheduleOverview from '../../features/schedule/components/Overview'

export default function Dashboard() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ScheduleOverview />
      <PlanningOverview />
    </div>
  )
}


