import NavBar from '../components/NavBar'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'

export default function AppShell() {
  const location = useLocation()
  return (
    <div className="min-h-full bg-transparent">
      <NavBar />
      <main className="relative z-10 w-full pt-16 min-h-[calc(100vh-64px)] px-2 flex flex-col overflow-x-auto">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}


