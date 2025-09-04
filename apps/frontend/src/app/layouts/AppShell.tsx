import NavBar from '../components/NavBar'
import { Outlet } from 'react-router-dom'

export default function AppShell() {
  return (
    <div className="min-h-full bg-gray-50">
      <NavBar />
      <main className="mx-auto max-w-6xl px-4 pt-16 pb-6">
        <Outlet />
      </main>
    </div>
  )
}


