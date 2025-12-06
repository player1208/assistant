import { lazy } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import AppShell from './layouts/AppShell'
import Dashboard from './pages/Dashboard'
import MePage from './pages/MePage'
import LoginPage from './pages/LoginPage'
import ChatTestPage from './pages/ChatTestPage'

const ScheduleRoutes = lazy(() => import('../features/schedule/routes'))
const DeadlineRoutes = lazy(() => import('../features/deadline/routes'))

export const router = createBrowserRouter([
  // 登录页面（不需要 AppShell 布局）
  {
    path: '/login',
    element: <LoginPage />,
  },
  // 主应用（需要 AppShell 布局）
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'schedule/*', element: <ScheduleRoutes /> },
      { path: 'deadline/*', element: <DeadlineRoutes /> },
      { path: 'me', element: <MePage /> },
      { path: 'chat-test', element: <ChatTestPage /> },
    ],
  },
])


