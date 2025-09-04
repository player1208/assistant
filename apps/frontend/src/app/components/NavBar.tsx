import { NavLink } from 'react-router-dom'

export default function NavBar() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium ${
      isActive ? 'bg-blue-600 text-white' : 'text-blue-600 hover:bg-blue-50'
    }`

  return (
    <header className="border-b bg-white">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <NavLink to="/" className="font-semibold text-lg text-gray-800">
          Assistent
        </NavLink>
        <nav className="flex gap-2">
          <NavLink to="/schedule" className={linkClass} end>
            Schedule
          </NavLink>
          <NavLink to="/planning" className={linkClass} end>
            Planning
          </NavLink>
        </nav>
      </div>
    </header>
  )
}


