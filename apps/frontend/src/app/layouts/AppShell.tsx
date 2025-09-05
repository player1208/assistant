import NavBar from '../components/NavBar'
import { Outlet } from 'react-router-dom'

export default function AppShell() {
  return (
    <div className="bg-gray-100 text-gray-800">
      <NavBar />
      <main className="w-full pt-16 h-screen">
        <Outlet />
      </main>
    </div>
  )
}


