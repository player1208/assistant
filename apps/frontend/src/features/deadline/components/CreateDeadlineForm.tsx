import { useState, useEffect } from 'react'
import type React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Target, Calendar, CalendarPlus } from 'lucide-react'
import { Deadline } from '../model'
import DateField from '../../../app/components/DateField'

// 主题颜色选项（红色保留给系统标识过期状态）
const THEME_COLORS = [
  { value: '#f59e0b', label: '橙色' },
  { value: '#10b981', label: '绿色' },
  { value: '#3b82f6', label: '蓝色' },
  { value: '#8b5cf6', label: '紫色' },
  { value: '#ec4899', label: '粉色' },
]

type FormData = {
  title: string
  description: string
  startDate: string     // 开始日期
  deadlineDate: string  // 截止日期
  themeColor: string
}

type Props = {
  onClose: () => void
  onSave: (data: FormData) => void
  onDelete?: (id: string) => void
  onAddToSchedule?: (deadline: Deadline) => void
  editingDeadline?: Deadline | null
  title?: string
  showCloseButton?: boolean
  showDeleteButton?: boolean
}

export default function CreateDeadlineForm({
  onClose,
  onSave,
  onDelete,
  onAddToSchedule,
  editingDeadline,
  title,
  showCloseButton = true,
  showDeleteButton = false
}: Props) {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    deadlineDate: new Date().toISOString().split('T')[0],
    themeColor: '#3b82f6',
  })

  const [startDatePickerOpen, setStartDatePickerOpen] = useState(false)
  const [endDatePickerOpen, setEndDatePickerOpen] = useState(false)

  useEffect(() => {
    if (editingDeadline) {
      setFormData({
        title: editingDeadline.title,
        description: editingDeadline.description || '',
        startDate: editingDeadline.startDate || editingDeadline.deadlineDate,
        deadlineDate: editingDeadline.deadlineDate,
        themeColor: editingDeadline.themeColor || '#3b82f6',
      })
    } else {
      const today = new Date().toISOString().split('T')[0]
      setFormData({
        title: '',
        description: '',
        startDate: today,
        deadlineDate: today,
        themeColor: '#3b82f6',
      })
    }
  }, [editingDeadline])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return
    onSave(formData)
    onClose()
  }

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAddToSchedule = () => {
    if (editingDeadline && onAddToSchedule) {
      onAddToSchedule(editingDeadline)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4" style={{ boxShadow: '0 1px 0 0 rgba(156, 163, 175, 0.3)' }}>
        <h2 className="text-lg font-semibold text-red-600">
          {title || (editingDeadline ? '编辑 Deadline' : '新建 Deadline')}
        </h2>
        {showCloseButton && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {(!editingDeadline && title === '编辑 Deadline') ? (
        <div className="flex-1 flex items-center justify-center p-4 text-gray-500 text-center">
          请在左侧列表中选择相应 Deadline
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <motion.div
            className="flex-1 p-5 space-y-5 overflow-y-auto scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.1, delayChildren: 0.2 }
              }
            }}
          >
            {/* 标题 */}
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                标题 <span className="text-red-500">*</span>
              </label>
              <motion.input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full px-3.5 py-2.5 text-[15px] border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="输入截止事项标题"
                required
                whileFocus={{ scale: 1.02 }}
              />
            </motion.div>

            {/* 描述 */}
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
              <label className="block text-sm font-medium text-gray-700 mb-2">描述</label>
              <motion.textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full px-3.5 py-2.5 text-[15px] border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows={3}
                placeholder="添加描述（可选）"
                whileFocus={{ scale: 1.02 }}
              />
            </motion.div>

            {/* 日期范围 - 开始日期和截止日期 */}
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4" />
                日期范围 <span className="text-red-500">*</span>
              </label>

              {/* 开始日期 */}
              <div className="mb-3">
                <span className="text-xs text-gray-500 mb-1 block">开始日期</span>
                <DateField
                  value={formData.startDate}
                  onChange={(v) => {
                    handleChange('startDate', v)
                    // 如果开始日期晚于截止日期，自动调整截止日期
                    if (v > formData.deadlineDate) {
                      handleChange('deadlineDate', v)
                    }
                    setStartDatePickerOpen(false)
                  }}
                  inline={true}
                  open={startDatePickerOpen}
                  onOpenChange={setStartDatePickerOpen}
                />
                <AnimatePresence mode="wait">
                  {startDatePickerOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, scale: 0.95 }}
                      animate={{
                        opacity: 1,
                        height: 'auto',
                        scale: 1,
                        transition: {
                          height: { type: 'spring', stiffness: 500, damping: 30, mass: 0.8 },
                          opacity: { duration: 0.2, ease: 'easeOut' },
                          scale: { type: 'spring', stiffness: 400, damping: 25 }
                        }
                      }}
                      exit={{
                        opacity: 0,
                        height: 0,
                        scale: 0.95,
                        transition: {
                          height: { duration: 0.2, ease: [0.4, 0, 1, 1] },
                          opacity: { duration: 0.15, ease: 'easeIn' },
                          scale: { duration: 0.15 }
                        }
                      }}
                      style={{ originY: 0, willChange: 'transform, opacity, height' }}
                      className="overflow-hidden mt-2"
                    >
                      <DateField
                        value={formData.startDate}
                        onChange={(v) => {
                          handleChange('startDate', v)
                          if (v > formData.deadlineDate) {
                            handleChange('deadlineDate', v)
                          }
                          setStartDatePickerOpen(false)
                        }}
                        inline={true}
                        open={true}
                        onOpenChange={setStartDatePickerOpen}
                        renderInlineCalendar={true}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 截止日期 */}
              <div>
                <span className="text-xs text-gray-500 mb-1 block">截止日期</span>
                <DateField
                  value={formData.deadlineDate}
                  onChange={(v) => {
                    handleChange('deadlineDate', v)
                    // 如果截止日期早于开始日期，自动调整开始日期
                    if (v < formData.startDate) {
                      handleChange('startDate', v)
                    }
                    setEndDatePickerOpen(false)
                  }}
                  inline={true}
                  open={endDatePickerOpen}
                  onOpenChange={setEndDatePickerOpen}
                />
                <AnimatePresence mode="wait">
                  {endDatePickerOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, scale: 0.95 }}
                      animate={{
                        opacity: 1,
                        height: 'auto',
                        scale: 1,
                        transition: {
                          height: { type: 'spring', stiffness: 500, damping: 30, mass: 0.8 },
                          opacity: { duration: 0.2, ease: 'easeOut' },
                          scale: { type: 'spring', stiffness: 400, damping: 25 }
                        }
                      }}
                      exit={{
                        opacity: 0,
                        height: 0,
                        scale: 0.95,
                        transition: {
                          height: { duration: 0.2, ease: [0.4, 0, 1, 1] },
                          opacity: { duration: 0.15, ease: 'easeIn' },
                          scale: { duration: 0.15 }
                        }
                      }}
                      style={{ originY: 0, willChange: 'transform, opacity, height' }}
                      className="overflow-hidden mt-2"
                    >
                      <DateField
                        value={formData.deadlineDate}
                        onChange={(v) => {
                          handleChange('deadlineDate', v)
                          if (v < formData.startDate) {
                            handleChange('startDate', v)
                          }
                          setEndDatePickerOpen(false)
                        }}
                        inline={true}
                        open={true}
                        onOpenChange={setEndDatePickerOpen}
                        renderInlineCalendar={true}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* 主题颜色 */}
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Target className="w-4 h-4" />
                主题颜色
              </label>
              <div className="flex gap-2 flex-wrap">
                {THEME_COLORS.map(color => (
                  <motion.button
                    key={color.value}
                    type="button"
                    onClick={() => handleChange('themeColor', color.value)}
                    className={`w-8 h-8 rounded-full transition-all ${formData.themeColor === color.value ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                    style={{ backgroundColor: color.value }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  />
                ))}
              </div>
            </motion.div>

            {/* 添加到日程提示 - 仅在编辑模式下显示 */}
            {editingDeadline && onAddToSchedule && (
              <motion.div
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                className="bg-blue-50 border border-blue-100 rounded-xl p-4"
              >
                <div className="flex items-start gap-3">
                  <CalendarPlus className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">想要更详尽的安排？</p>
                    <p className="text-xs text-blue-600 mt-1">将此 Deadline 添加到日程中，设置具体的时间和提醒</p>
                    <motion.button
                      type="button"
                      onClick={handleAddToSchedule}
                      className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <CalendarPlus className="w-4 h-4" />
                      添加到日程
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* 底部按钮 */}
          <motion.div
            className="p-4 bg-gray-50 border-t border-gray-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex gap-2">
              {showDeleteButton && editingDeadline && (
                <motion.button
                  type="button"
                  onClick={() => onDelete?.(editingDeadline.id)}
                  className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  删除
                </motion.button>
              )}
              <motion.button
                type="submit"
                disabled={!formData.title.trim()}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                whileHover={!formData.title.trim() ? {} : { scale: 1.02 }}
                whileTap={!formData.title.trim() ? {} : { scale: 0.98 }}
              >
                {editingDeadline ? '更新 Deadline' : '保存 Deadline'}
              </motion.button>
            </div>
          </motion.div>
        </form>
      )}
    </div>
  )
}

