import { lazy } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import AppShell from './layouts/AppShell'
import Dashboard from './pages/Dashboard'
import MePage from './pages/MePage'

const ScheduleRoutes = lazy(() => import('../features/schedule/routes'))
const PlanningRoutes = lazy(() => import('../features/planning/routes'))

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'schedule/*', element: <ScheduleRoutes /> },
      { path: 'planning/*', element: <PlanningRoutes /> },
      { path: 'me', element: <MePage /> },
    ],
  },
])


