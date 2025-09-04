import { NavLink } from 'react-router-dom'

export default function NavBar() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium ${
      isActive ? 'bg-blue-600 text-white' : 'text-blue-600 hover:bg-blue-50'
    }`

  return (
    <header className="fixed top-0 z-30 w-full bg-white/80 backdrop-blur-sm border-b">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <NavLink to="/" className="font-semibold text-lg text-gray-800">
          私人助理
        </NavLink>
        <nav className="flex gap-2">
          <NavLink to="/schedule" className={linkClass} end>
            Schedule
          </NavLink>
          <NavLink to="/planning" className={linkClass} end>
            Planning
          </NavLink>
          <NavLink to="/me" className={linkClass} end>
            Me
          </NavLink>
        </nav>
      </div>
    </header>
  )
}


