import { Suspense } from 'react'
import { Outlet, RouteObject, useRoutes } from 'react-router-dom'
import PlanningPage from './pages/PlanningPage'

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

// 进入模块即显示仿原型页面
function PlanningHome() {
  return <PlanningPage />
}

const routes: RouteObject[] = [
  {
    path: '/',
    element: <PlanningLayout />,
    children: [
      { index: true, element: <PlanningHome /> },
    ],
  },
]

export default function PlanningRoutes() {
  return useRoutes(routes)
}


