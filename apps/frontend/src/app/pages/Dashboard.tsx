import PlanningOverview from '../../features/planning/components/Overview'
import ScheduleOverview from '../../features/schedule/components/Overview'

export default function Dashboard() {
  return (
    <div id="page-home" className="h-full overflow-y-auto">
      <div className="grid gap-4 md:grid-cols-2 p-4">
        <ScheduleOverview />
        <PlanningOverview />
      </div>
    </div>
  )
}


