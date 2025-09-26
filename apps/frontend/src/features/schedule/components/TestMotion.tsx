import { useState } from 'react'
import { motion } from 'motion/react'

export default function TestMotion() {
  const [isLeft, setIsLeft] = useState(false)

  return (
    <div className="fixed top-20 left-20 z-50 bg-red-100 p-4 border-2 border-red-500">
      <h3 className="text-lg font-bold mb-4">Motion 测试</h3>
      
      <button 
        onClick={() => setIsLeft(!isLeft)}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        点击测试移动 (当前: {isLeft ? '左' : '右'})
      </button>
      
      <motion.div
        className="w-20 h-20 bg-blue-500 rounded"
        animate={{
          x: isLeft ? -100 : 0
        }}
        transition={{
          duration: 0.5,
          ease: "easeInOut"
        }}
        onAnimationStart={() => console.log('🧪 测试动画开始')}
        onAnimationComplete={() => console.log('🧪 测试动画完成')}
      />
    </div>
  )
}
