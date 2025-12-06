import { useEffect } from 'react'
import CreateScheduleForm from './CreateScheduleForm'
import { TaskColor } from '../model'

type FormData = {
  title: string
  description: string
  isAllDay: boolean
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  goalColor: TaskColor
}

type Props = {
  isOpen: boolean
  onClose: () => void
  onSave: (data: FormData) => void
}

export default function CreateScheduleModal({ isOpen, onClose, onSave }: Props) {
  // 阻止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* 桌面端：侧栏滑入 */}
      <div className="hidden lg:block">
        {/* 背景遮罩 */}
        <div 
          className="fixed inset-0 bg-black/20 z-40"
          onClick={onClose}
        />
        
        {/* 侧栏 */}
        <div className="fixed top-16 right-0 bottom-0 w-96 bg-white shadow-xl z-50 transform transition-transform duration-300">
          <CreateScheduleForm onClose={onClose} onSave={onSave} />
        </div>
      </div>

      {/* 移动端：模态弹窗 */}
      <div className="lg:hidden">
        {/* 背景遮罩 */}
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
        
        {/* 弹窗 */}
        <div className="fixed inset-4 bg-white rounded-lg shadow-xl z-50 flex flex-col max-h-[calc(100vh-2rem)]">
          <CreateScheduleForm onClose={onClose} onSave={onSave} />
        </div>
      </div>
    </>
  )
}
