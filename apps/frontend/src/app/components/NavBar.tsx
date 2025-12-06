import { NavLink } from 'react-router-dom'
import { CalendarDays, Target, UserRound, MessageCircle } from 'lucide-react'
import { motion } from 'motion/react'


export default function NavBar() {
  const colors = {
    schedule: '#2563eb', // blue
    deadline: '#dc2626', // red
    me: '#f59e0b', // amber
    chat: '#10b981', // green
  }

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-sm flex-shrink-0" style={{ boxShadow: '0 1px 0 0 rgba(156, 163, 175, 0.3)' }}>
      <div className="w-full px-4 h-14 flex items-center justify-between">
        <NavLink to="/" className="font-semibold text-lg text-gray-800 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-blue-600" />
          <span>私人助理</span>
        </NavLink>
        <nav className="relative flex gap-2">
          <NavLink to="/schedule" end className="relative px-3 py-2 rounded-md text-sm font-medium overflow-hidden">
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="topnav-pill"
                    className="absolute inset-0 rounded-md"
                    style={{ backgroundColor: colors.schedule }}
                    transition={{ type: 'spring', stiffness: 500, damping: 32, mass: 0.6 }}
                  />
                )}
                <motion.span
                  className="relative z-10 inline-flex items-center gap-1"
                  animate={{ color: isActive ? '#ffffff' : colors.schedule }}
                  transition={{ duration: 0.2 }}
                >
                  <CalendarDays className="w-4 h-4" /> 日程
                </motion.span>
              </>
            )}
          </NavLink>
          <NavLink to="/deadline" end className="relative px-3 py-2 rounded-md text-sm font-medium overflow-hidden">
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="topnav-pill"
                    className="absolute inset-0 rounded-md"
                    style={{ backgroundColor: colors.deadline }}
                    transition={{ type: 'spring', stiffness: 500, damping: 32, mass: 0.6 }}
                  />
                )}
                <motion.span
                  className="relative z-10 inline-flex items-center gap-1"
                  animate={{ color: isActive ? '#ffffff' : colors.deadline }}
                  transition={{ duration: 0.2 }}
                >
                  <Target className="w-4 h-4" /> Deadline
                </motion.span>
              </>
            )}
          </NavLink>
          <NavLink to="/me" end className="relative px-3 py-2 rounded-md text-sm font-medium overflow-hidden">
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="topnav-pill"
                    className="absolute inset-0 rounded-md"
                    style={{ backgroundColor: colors.me }}
                    transition={{ type: 'spring', stiffness: 500, damping: 32, mass: 0.6 }}
                  />
                )}
                <motion.span
                  className="relative z-10 inline-flex items-center gap-1"
                  animate={{ color: isActive ? '#ffffff' : colors.me }}
                  transition={{ duration: 0.2 }}
                >
                  <UserRound className="w-4 h-4" /> 我的
                </motion.span>
              </>
            )}
          </NavLink>
          <NavLink to="/chat-test" end className="relative px-3 py-2 rounded-md text-sm font-medium overflow-hidden">
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="topnav-pill"
                    className="absolute inset-0 rounded-md"
                    style={{ backgroundColor: colors.chat }}
                    transition={{ type: 'spring', stiffness: 500, damping: 32, mass: 0.6 }}
                  />
                )}
                <motion.span
                  className="relative z-10 inline-flex items-center gap-1"
                  animate={{ color: isActive ? '#ffffff' : colors.chat }}
                  transition={{ duration: 0.2 }}
                >
                  <MessageCircle className="w-4 h-4" /> 测试
                </motion.span>
              </>
            )}
          </NavLink>
        </nav>
      </div>
    </header>
  )
}


