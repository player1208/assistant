import { useState, useEffect } from 'react'
import type React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Clock, Calendar, Target, Phone } from 'lucide-react'
import { TaskColor, Task } from '../model'
import DateField from '../../../app/components/DateField'
import TimeField from '../../../app/components/TimeField'

type FormData = {
  title: string
  description: string
  isAllDay: boolean
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  goalColor: TaskColor
  isUrgent: boolean
}

type Props = {
  onClose: () => void
  onSave: (data: FormData) => void
  onDelete?: (id: string) => void // 删除回调
  editingTask?: Task | null
  title?: string // 自定义标题
  showCloseButton?: boolean // 是否显示关闭按钮
  showDeleteButton?: boolean // 是否显示删除按钮
  footerRef?: React.Ref<HTMLDivElement> // 底部按钮区域ref（用于外部定位/测量）
}

const goalOptions: { value: TaskColor; label: string; color: string }[] = [
  { value: 'green', label: '工作任务', color: 'bg-green-100 text-green-800' },
  { value: 'purple', label: '个人发展', color: 'bg-purple-100 text-purple-800' },
  { value: 'indigo', label: '学习成长', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'teal', label: '生活管理', color: 'bg-teal-100 text-teal-800' },
]

export default function CreateScheduleForm({ onClose, onSave, onDelete, editingTask, title, showCloseButton = true, showDeleteButton = false, footerRef }: Props) {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    isAllDay: false,
    startDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endDate: new Date().toISOString().split('T')[0],
    endTime: '10:00',
    goalColor: 'green',
    isUrgent: false,
  })

  // 当编辑任务时，填充表单数据
  useEffect(() => {
    if (editingTask) {
      setFormData({
        title: editingTask.title,
        description: editingTask.description || '',
        isAllDay: !editingTask.time,
        startDate: new Date().toISOString().split('T')[0], // 简化处理，实际应解析任务日期
        startTime: editingTask.time || '09:00',
        endDate: new Date().toISOString().split('T')[0],
        endTime: '10:00',
        goalColor: editingTask.goalColor || 'green',
        isUrgent: editingTask.isUrgent || false,
      })
    } else {
      // 重置为新建模式
      setFormData({
        title: '',
        description: '',
        isAllDay: false,
        startDate: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endDate: new Date().toISOString().split('T')[0],
        endTime: '10:00',
        goalColor: 'green',
        isUrgent: false,
      })
    }
  }, [editingTask])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return
    onSave(formData)
    onClose()
  }

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4" style={{ boxShadow: '0 1px 0 0 rgba(156, 163, 175, 0.3)' }}>
        <h2 className="text-lg font-semibold">
          {title || (editingTask ? '编辑日程' : '新建日程')}
        </h2>
        {showCloseButton && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
            aria-label="关闭"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {(!editingTask && title === '编辑日程') ? (
        <div className="flex-1 flex items-center justify-center p-4 text-gray-500 text-center">
          请在左侧日程列表中选择相应任务
        </div>
      ) : (
        // Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <motion.div
            className="flex-1 p-5 space-y-5 overflow-y-auto"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1,
                  delayChildren: 0.2
                }
              }
            }}
          >
            {/* 标题 */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                标题 <span className="text-red-500">*</span>
              </label>
              <motion.input

                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full px-3.5 py-2.5 text-[15px] border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={editingTask ? "" : "输入任务标题"}
                required
                whileFocus={{ scale: 1.02 }}
              />
            </motion.div>

            {/* 描述 */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                描述
              </label>
              <motion.textarea

                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full px-3.5 py-2.5 text-[15px] border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                placeholder={editingTask ? "" : "添加任务描述（可选）"}
                whileFocus={{ scale: 1.02 }}
              />
            </motion.div>

            {/* 全天任务开关 */}
            <motion.div
              className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all cursor-pointer ${formData.isAllDay ? 'bg-blue-50 ring-2 ring-blue-500' : 'bg-gray-50'}`}
              onClick={() => handleChange('isAllDay', !formData.isAllDay)}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
            >
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                <Clock className="w-4 h-4 cursor-pointer" />
                全天任务
              </label>
              <motion.button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleChange('isAllDay', !formData.isAllDay) }}
                className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                  formData.isAllDay ? 'bg-blue-600' : 'bg-gray-300'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="absolute top-1 w-4 h-4 bg-white rounded-full"
                  animate={{
                    x: formData.isAllDay ? 24 : 4
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </motion.button>
            </motion.div>

            {/* 时间选择 */}
            <AnimatePresence initial={false} mode="wait">
              {!formData.isAllDay && (
                <motion.div
                  className="space-y-3"
                  initial={{ opacity: 0, scale: 0.96, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 8 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 30, mass: 0.6 }}
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                    <Calendar className="w-4 h-4 cursor-pointer" />
                    时间安排
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <label className="block text-xs text-gray-500 mb-1">开始日期</label>
                      <DateField
                        value={formData.startDate}
                        onChange={(v) => handleChange('startDate', v)}
                      />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <label className="block text-xs text-gray-500 mb-1">开始时间</label>
                      <TimeField
                        value={formData.startTime}
                        onChange={(v) => handleChange('startTime', v)}
                      />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <label className="block text-xs text-gray-500 mb-1">结束日期</label>
                      <DateField
                        value={formData.endDate}
                        onChange={(v) => handleChange('endDate', v)}
                      />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <label className="block text-xs text-gray-500 mb-1">结束时间</label>
                      <TimeField
                        value={formData.endTime}
                        onChange={(v) => handleChange('endTime', v)}
                      />
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 关联目标 */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
            >
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Target className="w-4 h-4" />
                关联目标
              </label>
              <motion.div
                className="grid grid-cols-2 gap-3"
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: 0.05
                    }
                  }
                }}
              >
                {goalOptions.map((option, index) => (
                  <motion.button
                    key={option.value}
                    type="button"
                    onClick={() => handleChange('goalColor', option.value)}
                    className={`h-10 px-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                      formData.goalColor === option.value
                        ? `${option.color} ring-2 ring-blue-500`
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                    variants={{
                      hidden: { opacity: 0, scale: 0.8 },
                      visible: { opacity: 1, scale: 1 }
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {option.label}
                  </motion.button>
                ))}
              </motion.div>
            </motion.div>

            {/* 电话预警开关 */}
            <motion.div
              className="flex items-center justify-between"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
            >
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                <Phone className="w-4 h-4" />
                电话预警
              </label>
              <motion.button
                type="button"
                onClick={() => handleChange('isUrgent', !formData.isUrgent)}
                className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                  formData.isUrgent ? 'bg-red-600' : 'bg-gray-300'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="absolute top-1 w-4 h-4 bg-white rounded-full"
                  animate={{
                    x: formData.isUrgent ? 24 : 4
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </motion.button>
            </motion.div>
          </motion.div>

          {/* 底部按钮区域 */}
          <motion.div
            ref={footerRef as any}
            className="p-4 bg-gray-50 border-t border-gray-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <motion.div
              className="flex gap-2"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1
                  }
                }
              }}
              initial="hidden"
              animate="visible"
            >
              {showDeleteButton && editingTask && (
                <motion.button
                  type="button"
                  onClick={() => onDelete?.(editingTask.id)}
                  className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors cursor-pointer"
                  variants={{
                    hidden: { opacity: 0, x: -20 },
                    visible: { opacity: 1, x: 0 }
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  删除
                </motion.button>
              )}
              <motion.button
                type="submit"
                disabled={!formData.title.trim()}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors cursor-pointer"
                variants={{
                  hidden: { opacity: 0, x: 20 },
                  visible: { opacity: 1, x: 0 }
                }}
                whileHover={!formData.title.trim() ? {} : { scale: 1.05 }}
                whileTap={!formData.title.trim() ? {} : { scale: 0.95 }}
              >
                {editingTask ? '更新日程' : '保存日程'}
              </motion.button>
            </motion.div>
          </motion.div>
        </form>
      )}
    </div>
  )
}
