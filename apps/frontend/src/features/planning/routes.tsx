import { Suspense } from 'react'
import { Outlet, RouteObject, useRoutes } from 'react-router-dom'

function PlanningLayout() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Planning</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <Outlet />
      </Suspense>
    </div>
  )
}

function PlanningHome() {
  return <div>Planning Home</div>
}

const routes: RouteObject[] = [
  {
    path: '/',
    element: <PlanningLayout />,
    children: [{ index: true, element: <PlanningHome /> }],
  },
]

export default function PlanningRoutes() {
  return useRoutes(routes)
}


