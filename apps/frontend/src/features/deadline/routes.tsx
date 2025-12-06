import { Suspense } from 'react'
import { Outlet, RouteObject, useRoutes } from 'react-router-dom'
import DeadlinePage from './pages/DeadlinePage'

function DeadlineLayout() {
  return (
    <div className="pt-2 px-4 pb-0 flex-1 flex flex-col">
      <Suspense fallback={<div>Loading...</div>}>
        <Outlet />
      </Suspense>
    </div>
  )
}

function DeadlineHome() {
  return <DeadlinePage />
}

const routes: RouteObject[] = [
  {
    path: '/',
    element: <DeadlineLayout />,
    children: [
      { index: true, element: <DeadlineHome /> },
    ],
  },
]

export default function DeadlineRoutes() {
  return useRoutes(routes)
}

