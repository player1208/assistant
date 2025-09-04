import { Suspense } from 'react'
import { Outlet, RouteObject, useRoutes } from 'react-router-dom'

function ScheduleLayout() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Schedule</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <Outlet />
      </Suspense>
    </div>
  )
}

function ScheduleHome() {
  return <div>Schedule Home</div>
}

const routes: RouteObject[] = [
  {
    path: '/',
    element: <ScheduleLayout />,
    children: [{ index: true, element: <ScheduleHome /> }],
  },
]

export default function ScheduleRoutes() {
  return useRoutes(routes)
}


