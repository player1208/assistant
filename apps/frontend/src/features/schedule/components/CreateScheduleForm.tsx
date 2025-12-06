import { useState, useEffect } from 'react'
import type React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Clock, Calendar, Bell, Plus, Trash2 } from 'lucide-react'
import { TaskColor, Task } from '../model'
import DateField from '../../../app/components/DateField'
import TimeField from '../../../app/components/TimeField'

// 提醒时间选项
const REMINDER_OPTIONS = [
  { value: 0, label: '准时' },
  { value: 5, label: '5分钟前' },
  { value: 10, label: '10分钟前' },
  { value: 15, label: '15分钟前' },
  { value: 30, label: '30分钟前' },
  { value: 60, label: '1小时前' },
  { value: 120, label: '2小时前' },
  { value: 1440, label: '1天前' },
  { value: 2880, label: '2天前' },
]

type FormData = {
  title: string
  description: string
  isAllDay: boolean
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  goalColor: TaskColor
  reminders: number[] // 提醒时间（分钟）
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
    reminders: [],
  })
  
  // 控制日期选择器的展开状态
  const [startDatePickerOpen, setStartDatePickerOpen] = useState(false)
  const [endDatePickerOpen, setEndDatePickerOpen] = useState(false)
  // 控制时间选择器的展开状态
  const [startTimePickerOpen, setStartTimePickerOpen] = useState(false)
  const [endTimePickerOpen, setEndTimePickerOpen] = useState(false)

  // 互斥逻辑：当打开一个选择器时，关闭其他所有选择器
  const handleStartDatePickerOpen = (open: boolean) => {
    if (open) {
      // 关闭其他选择器
      setEndDatePickerOpen(false)
      setStartTimePickerOpen(false)
      setEndTimePickerOpen(false)
    }
    setStartDatePickerOpen(open)
  }

  const handleEndDatePickerOpen = (open: boolean) => {
    if (open) {
      setStartDatePickerOpen(false)
      setStartTimePickerOpen(false)
      setEndTimePickerOpen(false)
    }
    setEndDatePickerOpen(open)
  }

  const handleStartTimePickerOpen = (open: boolean) => {
    if (open) {
      setStartDatePickerOpen(false)
      setEndDatePickerOpen(false)
      setEndTimePickerOpen(false)
    }
    setStartTimePickerOpen(open)
  }

  const handleEndTimePickerOpen = (open: boolean) => {
    if (open) {
      setStartDatePickerOpen(false)
      setEndDatePickerOpen(false)
      setStartTimePickerOpen(false)
    }
    setEndTimePickerOpen(open)
  }

  // 当编辑任务时，填充表单数据
  useEffect(() => {
    if (editingTask) {
      setFormData({
        title: editingTask.title,
        description: editingTask.description || '',
        isAllDay: editingTask.isAllDay,
        startDate: editingTask.date || new Date().toISOString().split('T')[0],
        startTime: editingTask.startTime || '09:00',
        // 使用 endDate 字段，如果没有则用 date（向后兼容）
        endDate: editingTask.endDate || editingTask.date || new Date().toISOString().split('T')[0],
        endTime: editingTask.endTime || '10:00',
        goalColor: editingTask.goalColor || 'green',
        reminders: (editingTask as any).reminders || [],
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
        reminders: [],
      })
    }
  }, [editingTask])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return
    onSave(formData)
    onClose()
  }

  const handleChange = (field: keyof FormData, value: string | boolean | number[]) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }

      // 当修改开始日期或开始时间时，检查是否需要调整结束日期/时间
      if (field === 'startDate' || field === 'startTime') {
        const startDateTime = new Date(`${updated.startDate}T${updated.startTime}`)
        const endDateTime = new Date(`${updated.endDate}T${updated.endTime}`)

        // 如果开始时间比结束时间晚，将结束时间调整为和开始时间相同
        if (startDateTime > endDateTime) {
          updated.endDate = updated.startDate
          updated.endTime = updated.startTime
        }
      }

      return updated
    })
  }

  // 添加提醒
  const addReminder = () => {
    // 找到一个未使用的提醒时间
    const usedReminders = new Set(formData.reminders)
    const availableReminder = REMINDER_OPTIONS.find(opt => !usedReminders.has(opt.value))
    if (availableReminder) {
      setFormData(prev => ({
        ...prev,
        reminders: [...prev.reminders, availableReminder.value].sort((a, b) => a - b)
      }))
    }
  }

  // 删除提醒
  const removeReminder = (index: number) => {
    setFormData(prev => ({
      ...prev,
      reminders: prev.reminders.filter((_, i) => i !== index)
    }))
  }

  // 更新提醒
  const updateReminder = (index: number, value: number) => {
    setFormData(prev => ({
      ...prev,
      reminders: prev.reminders.map((r, i) => i === index ? value : r).sort((a, b) => a - b)
    }))
  }

  // 获取提醒时间的显示文本
  const getReminderLabel = (minutes: number) => {
    return REMINDER_OPTIONS.find(opt => opt.value === minutes)?.label || `${minutes}分钟前`
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
            className="flex-1 p-5 space-y-5 overflow-y-auto scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
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
                        onChange={(v) => {
                          handleChange('startDate', v)
                          setStartDatePickerOpen(false)
                        }}
                        inline={true}
                        open={startDatePickerOpen}
                        onOpenChange={handleStartDatePickerOpen}
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
                        onChange={(v) => {
                          handleChange('startTime', v)
                          setStartTimePickerOpen(false)
                        }}
                        inline={true}
                        open={startTimePickerOpen}
                        onOpenChange={handleStartTimePickerOpen}
                      />
                    </motion.div>
                  </div>

                  {/* 内联展开的开始日期选择器 */}
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
                        className="overflow-hidden"
                      >
                        <DateField
                          value={formData.startDate}
                          onChange={(v) => {
                            handleChange('startDate', v)
                            setStartDatePickerOpen(false)
                          }}
                          inline={true}
                          open={true}
                          onOpenChange={handleStartDatePickerOpen}
                          renderInlineCalendar={true}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* 内联展开的开始时间选择器 */}
                  <AnimatePresence mode="wait">
                    {startTimePickerOpen && (
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
                        className="overflow-hidden"
                      >
                        <TimeField
                          value={formData.startTime}
                          onChange={(v) => {
                            handleChange('startTime', v)
                            setStartTimePickerOpen(false)
                          }}
                          inline={true}
                          open={true}
                          onOpenChange={handleStartTimePickerOpen}
                          renderInlineWheel={true}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="grid grid-cols-2 gap-3">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <label className="block text-xs text-gray-500 mb-1">结束日期</label>
                      <DateField
                        value={formData.endDate}
                        onChange={(v) => {
                          handleChange('endDate', v)
                          setEndDatePickerOpen(false)
                        }}
                        inline={true}
                        open={endDatePickerOpen}
                        onOpenChange={handleEndDatePickerOpen}
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
                        onChange={(v) => {
                          handleChange('endTime', v)
                          setEndTimePickerOpen(false)
                        }}
                        inline={true}
                        open={endTimePickerOpen}
                        onOpenChange={handleEndTimePickerOpen}
                      />
                    </motion.div>
                  </div>

                  {/* 内联展开的结束日期选择器 */}
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
                        className="overflow-hidden"
                      >
                        <DateField
                          value={formData.endDate}
                          onChange={(v) => {
                            handleChange('endDate', v)
                            setEndDatePickerOpen(false)
                          }}
                          inline={true}
                          open={true}
                          onOpenChange={handleEndDatePickerOpen}
                          renderInlineCalendar={true}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* 内联展开的结束时间选择器 */}
                  <AnimatePresence mode="wait">
                    {endTimePickerOpen && (
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
                        className="overflow-hidden"
                      >
                        <TimeField
                          value={formData.endTime}
                          onChange={(v) => {
                            handleChange('endTime', v)
                            setEndTimePickerOpen(false)
                          }}
                          inline={true}
                          open={true}
                          onOpenChange={handleEndTimePickerOpen}
                          renderInlineWheel={true}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 提醒时间 */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Bell className="w-4 h-4" />
                  提醒时间
                </label>
                {formData.reminders.length < REMINDER_OPTIONS.length && (
                  <motion.button
                    type="button"
                    onClick={addReminder}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    添加提醒
                  </motion.button>
                )}
              </div>

              <AnimatePresence mode="popLayout">
                {formData.reminders.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-sm text-gray-400 py-2"
                  >
                    暂无提醒，点击"添加提醒"设置
                  </motion.div>
                ) : (
                  <motion.div className="space-y-2">
                    {formData.reminders.map((reminder, index) => (
                      <motion.div
                        key={`reminder-${index}-${reminder}`}
                        initial={{ opacity: 0, x: -20, height: 0 }}
                        animate={{ opacity: 1, x: 0, height: 'auto' }}
                        exit={{ opacity: 0, x: 20, height: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="flex items-center gap-2"
                      >
                        <select
                          value={reminder}
                          onChange={(e) => updateReminder(index, Number(e.target.value))}
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer"
                        >
                          {REMINDER_OPTIONS.map(opt => (
                            <option
                              key={opt.value}
                              value={opt.value}
                              disabled={formData.reminders.includes(opt.value) && opt.value !== reminder}
                            >
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <motion.button
                          type="button"
                          onClick={() => removeReminder(index)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
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
