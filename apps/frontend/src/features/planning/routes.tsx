import { Suspense } from 'react'
import { Outlet, RouteObject, useRoutes } from 'react-router-dom'
import PlanningPage from './pages/PlanningPage'

function PlanningLayout() {
  // Immersive canvas wants full-bleed; no padding/header wrapper
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Outlet />
    </Suspense>
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


