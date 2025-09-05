import { NavLink } from 'react-router-dom'
import { ClipboardCheck, CalendarDays, Network, UserRound } from 'lucide-react'

export default function NavBar() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `nav-btn flex items-center gap-2 p-2 rounded-lg text-sm font-semibold ${
      isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-100'
    }`

  return (
    <nav className="fixed top-0 z-30 w-full bg-white/80 backdrop-blur-sm border-b flex items-center justify-between px-4 h-16">
      <div className="flex items-center gap-3">
        <ClipboardCheck className="w-8 h-8 text-blue-600" />
        <h1 className="text-xl font-bold hidden sm:block">私人助理</h1>
      </div>
      <div className="flex items-center gap-2">
        <NavLink to="/schedule" className={linkClass} end>
          <CalendarDays className="w-5 h-5" />
          <span>日程</span>
        </NavLink>
        <NavLink to="/planning" className={linkClass} end>
          <Network className="w-5 h-5" />
          <span>规划</span>
        </NavLink>
        <NavLink to="/me" className={linkClass} end>
          <UserRound className="w-5 h-5" />
          <span>我的</span>
        </NavLink>
      </div>
    </nav>
  )
}


