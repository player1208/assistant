import { motion } from 'motion/react'
import { Edit3 } from 'lucide-react'

type Props = {
  onClick: () => void
}

export default function FloatingAddButton({ onClick }: Props) {
  return (
    <motion.button
      onClick={onClick}
      className="fixed bottom-24 right-6 lg:bottom-8 lg:right-[max(1rem,calc(50vw-576px+1rem))] w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-30 flex items-center justify-center"
      aria-label="编辑任务"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}

    >
      <Edit3 className="w-5 h-5" />
    </motion.button>
  )
}
