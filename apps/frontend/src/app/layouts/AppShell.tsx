import NavBar from '../components/NavBar'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import InteractiveBackground from '../../features/schedule/components/InteractiveBackground'

export default function AppShell() {
  const location = useLocation()
  return (
    <div className="h-screen flex flex-col bg-transparent overflow-hidden">
      {/* 全局粒子背景，只初始化一次 */}
      <InteractiveBackground />
      <NavBar />
      <main className="relative z-10 w-full flex-1 min-h-0 px-4 py-4 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
            transition={{
              duration: 0.4,
              ease: [0.25, 0.46, 0.45, 0.94],
              opacity: { duration: 0.3 },
              filter: { duration: 0.3 }
            }}
            className="flex-1 min-h-0 flex flex-col overflow-hidden"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}


