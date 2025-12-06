"use client"

import { useRef, useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Calendar as CalendarIcon } from "lucide-react"
import { DayPicker } from "react-day-picker"
import "react-day-picker/style.css"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import WheelYearMonthPicker from "./WheelYearMonthPicker"

export type DateFieldProps = {
  value: string // YYYY-MM-DD
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  inline?: boolean // 是否内联模式（父组件控制）
  open?: boolean // 打开状态（受控）
  onOpenChange?: (open: boolean) => void // 打开状态变化回调
  renderInlineCalendar?: boolean // 是否渲染内联日历（不渲染按钮）
}

export default function DateField({ 
  value, 
  onChange, 
  placeholder, 
  className = "",
  inline = false,
  open: controlledOpen,
  onOpenChange,
  renderInlineCalendar = false
}: DateFieldProps) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const popRef = useRef<HTMLDivElement>(null)
  const [internalOpen, setInternalOpen] = useState(false)
  const [showYearMonthPicker, setShowYearMonthPicker] = useState(false)
  
  // 使用受控或非受控状态
  const open = inline ? (controlledOpen ?? internalOpen) : internalOpen
  const setOpen = inline 
    ? (value: boolean) => {
        setInternalOpen(value)
        onOpenChange?.(value)
      }
    : setInternalOpen

  // 当弹窗关闭时，重置年月选择器状态
  useEffect(() => {
    if (!open) {
      setShowYearMonthPicker(false)
    }
  }, [open])


  const date = useMemo(() => {
    const d = new Date(value)
    return isNaN(d.getTime()) ? new Date() : d
  }, [value])

  // 关闭：ESC 或点击外部（仅在非 inline 模式下生效）
  useEffect(() => {
    // inline 模式下不需要点击外部关闭，由父组件控制
    if (!open || inline) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showYearMonthPicker) {
          setShowYearMonthPicker(false)
        } else {
          setOpen(false)
        }
      }
    }
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (btnRef.current && (btnRef.current === target || btnRef.current.contains(target))) return
      if (popRef.current && popRef.current.contains(target)) return

      if (showYearMonthPicker) {
        setShowYearMonthPicker(false)
      } else {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('click', onClick)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('click', onClick)
    }
  }, [open, showYearMonthPicker, inline])

  const [pos, setPos] = useState<{top:number,left:number,width:number}>({ top: 0, left: 0, width: 0 })

  const updatePos = () => {
    const el = btnRef.current
    if (!el) return
    const r = el.getBoundingClientRect()

    // 日期选择器的位置计算（宽度320px）
    const datePickerWidth = 320
    const datePickerLeft = Math.max(8, Math.min(r.left, window.innerWidth - datePickerWidth))

    setPos({
      top: r.bottom + 6,
      left: datePickerLeft,
      width: r.width
    })
  }

  useEffect(() => { if (open) { updatePos(); setTimeout(updatePos, 0) } }, [open])
  useEffect(() => {
    const h = () => {
      if (open) {
        updatePos()
        // 如果年月选择器正在显示，也需要重新计算位置
        if (showYearMonthPicker) {
          // 触发重新渲染以更新年月选择器位置
          setShowYearMonthPicker(true)
        }
      }
    }
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [open, showYearMonthPicker])

  // 弹出式日历的显示月份
  const [popupDisplayMonth, setPopupDisplayMonth] = useState(date)
  // 弹出式滚轮临时选择的月份
  const popupWheelTempMonth = useRef(date)

  // 滚轮选择器变化时只更新 ref
  const handlePopupWheelChange = (selectedDate: Date) => {
    popupWheelTempMonth.current = selectedDate
  }

  // 切换弹出式滚轮选择器
  const togglePopupWheelPicker = () => {
    if (showYearMonthPicker) {
      setPopupDisplayMonth(popupWheelTempMonth.current)
    } else {
      popupWheelTempMonth.current = popupDisplayMonth
    }
    setShowYearMonthPicker(!showYearMonthPicker)
  }
  // 内联日历的状态 - 是否显示滚轮选择器
  const [showWheelPicker, setShowWheelPicker] = useState(false)
  // 当前显示的月份（用于 DayPicker）
  const [displayMonth, setDisplayMonth] = useState(date)
  // 滚轮临时选择的月份（不触发重渲染）
  const wheelTempMonth = useRef(date)

  // 滚轮选择器变化时只更新 ref，不触发重渲染
  const handleWheelChange = (selectedDate: Date) => {
    wheelTempMonth.current = selectedDate
  }

  // 切换滚轮选择器显示状态
  const toggleWheelPicker = () => {
    if (showWheelPicker) {
      // 关闭时：同步滚轮选择的月份到 displayMonth
      setDisplayMonth(wheelTempMonth.current)
    } else {
      // 打开时：初始化滚轮临时值
      wheelTempMonth.current = displayMonth
    }
    setShowWheelPicker(!showWheelPicker)
  }

  // 内联日历组件（苹果风格）
  const InlineCalendar = () => (
    <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
      {/* 顶部：年月标题 + 导航按钮 */}
      <div className="flex items-center justify-between px-2 pt-1 pb-2">
        <button
          type="button"
          onClick={toggleWheelPicker}
          className="text-sm font-semibold cursor-pointer hover:text-blue-600 transition-colors bg-transparent border-0 p-0"
        >
          {format(showWheelPicker ? wheelTempMonth.current : displayMonth, 'yyyy', { locale: zhCN })} {format(showWheelPicker ? wheelTempMonth.current : displayMonth, 'MMMM', { locale: zhCN })}
        </button>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => {
              const prev = new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1)
              setDisplayMonth(prev)
            }}
            className="h-8 w-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 bg-transparent border-0 text-gray-600 transition-colors"
          >
            &lt;
          </button>
          <button
            type="button"
            onClick={() => {
              const next = new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1)
              setDisplayMonth(next)
            }}
            className="h-8 w-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 bg-transparent border-0 text-gray-600 transition-colors"
          >
            &gt;
          </button>
        </div>
      </div>

      {/* 内容区：滚轮或日期网格 */}
      <AnimatePresence mode="wait">
        {showWheelPicker ? (
          <motion.div
            key="wheel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="py-4"
          >
            <div className="flex justify-center">
              <WheelYearMonthPicker
                value={displayMonth}
                onChange={handleWheelChange}
              />
            </div>
            {/* 确认和取消按钮 */}
            <div className="flex gap-3 mt-4 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  // 取消：不更新 displayMonth，直接关闭
                  setShowWheelPicker(false)
                }}
                className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 active:scale-[0.98]"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  // 确认：更新 displayMonth
                  setDisplayMonth(wheelTempMonth.current)
                  setShowWheelPicker(false)
                }}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-xl transition-all duration-200 shadow-sm hover:shadow active:scale-[0.98]"
              >
                确认
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="calendar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* 日期网格 - 使用 DayPicker 自带的星期标题 */}
            <DayPicker
              mode="single"
              month={displayMonth}
              onMonthChange={setDisplayMonth}
              selected={date}
              onSelect={(d) => { if (d) { onChange(format(d, 'yyyy-MM-dd')) } }}
              locale={zhCN}
              weekStartsOn={1}
              hideNavigation
              startMonth={new Date(1970, 0, 1)}
              endMonth={new Date(2100, 11, 31)}
              formatters={{
                formatWeekdayName: (date) => ['日', '一', '二', '三', '四', '五', '六'][date.getDay()]
              }}
              classNames={{
                months: 'p-0',
                month: 'p-0',
                month_caption: 'hidden',
                caption_label: 'hidden',
                nav: 'hidden',
                weekdays: 'grid grid-cols-7 mb-1',
                weekday: 'w-9 h-7 text-center text-xs text-gray-500 flex items-center justify-center',
                weeks: '',
                week: 'grid grid-cols-7',
                day: 'w-9 h-9 text-center',
                day_button: 'w-9 h-9 rounded-full text-sm focus:outline-none hover:bg-gray-200 transition-colors',
                selected: 'ring-2 ring-gray-800 font-semibold',
                today: 'text-blue-600 font-medium',
                outside: 'text-gray-300',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  // 如果是纯内联日历模式，只渲染日历
  if (renderInlineCalendar) {
    return <InlineCalendar />
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(!open) }}
        className={("w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 cursor-pointer flex items-center justify-between gap-2 bg-white pointer-events-auto " + className).trim()}
      >
        <span className="truncate text-left flex-1">{value ? value.replace(/-/g, '/') : (placeholder || '')}</span>
        <CalendarIcon className="w-4 h-4 text-gray-500" />
      </button>


      <AnimatePresence initial={false} mode="wait">
        {open && !inline ? (
          <motion.div
            key="calendar-pop"
            ref={(el) => { popRef.current = el }}
            className="fixed z-[9999] bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-2xl ring-1 ring-gray-200 p-3"
            style={{ top: pos.top, left: pos.left, width: 320, transformOrigin: 'top left' }}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28, mass: 0.8 }}
          >
            {/* 顶部：年月标题 + 导航按钮 */}
            <div className="flex items-center justify-between px-2 pt-2 pb-2">
              <button
                type="button"
                onClick={togglePopupWheelPicker}
                className="text-base font-semibold cursor-pointer hover:text-blue-600 transition-colors bg-transparent border-0 p-0"
              >
                {format(showYearMonthPicker ? popupWheelTempMonth.current : popupDisplayMonth, 'yyyy', { locale: zhCN })} {format(showYearMonthPicker ? popupWheelTempMonth.current : popupDisplayMonth, 'MMMM', { locale: zhCN })}
              </button>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    const prev = new Date(popupDisplayMonth.getFullYear(), popupDisplayMonth.getMonth() - 1, 1)
                    setPopupDisplayMonth(prev)
                  }}
                  className="h-8 w-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-100 bg-transparent border-0 text-gray-600 transition-colors"
                >
                  &lt;
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = new Date(popupDisplayMonth.getFullYear(), popupDisplayMonth.getMonth() + 1, 1)
                    setPopupDisplayMonth(next)
                  }}
                  className="h-8 w-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-100 bg-transparent border-0 text-gray-600 transition-colors"
                >
                  &gt;
                </button>
              </div>
            </div>

            {/* 内容区：滚轮或日期网格 */}
            <AnimatePresence mode="wait">
              {showYearMonthPicker ? (
                <motion.div
                  key="popup-wheel"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="py-4"
                >
                  <div className="flex justify-center">
                    <WheelYearMonthPicker
                      value={popupDisplayMonth}
                      onChange={handlePopupWheelChange}
                    />
                  </div>
                  {/* 确认和取消按钮 */}
                  <div className="flex gap-3 mt-4 pt-3 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        // 取消：不更新 popupDisplayMonth，直接关闭
                        setShowYearMonthPicker(false)
                      }}
                      className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 active:scale-[0.98]"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        // 确认：更新 popupDisplayMonth
                        setPopupDisplayMonth(popupWheelTempMonth.current)
                        setShowYearMonthPicker(false)
                      }}
                      className="flex-1 py-2.5 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-xl transition-all duration-200 shadow-sm hover:shadow active:scale-[0.98]"
                    >
                      确认
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="popup-calendar"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {/* 日期网格 - 使用 DayPicker 自带的星期标题 */}
                  <DayPicker
                    mode="single"
                    month={popupDisplayMonth}
                    onMonthChange={setPopupDisplayMonth}
                    selected={date}
                    onSelect={(d) => { if (d) { onChange(format(d, 'yyyy-MM-dd')); setOpen(false) } }}
                    locale={zhCN}
                    weekStartsOn={1}
                    hideNavigation
                    captionLayout="label"
                    startMonth={new Date(1970, 0, 1)}
                    endMonth={new Date(2100, 11, 31)}
                    formatters={{
                      formatWeekdayName: (date) => ['日', '一', '二', '三', '四', '五', '六'][date.getDay()]
                    }}
                    classNames={{
                      month: 'p-0 relative',
                      caption: 'hidden',
                      weekdays: 'grid grid-cols-7 mb-1',
                      weekday: 'w-10 h-8 text-center text-xs text-gray-500 flex items-center justify-center',
                      weeks: '',
                      week: 'grid grid-cols-7',
                      day: 'w-10 h-10 text-center',
                      day_button: 'w-10 h-10 rounded-lg focus:outline-none hover:bg-gray-100 transition-colors',
                      selected: 'bg-blue-600 text-white rounded-lg',
                      today: 'ring-1 ring-blue-500',
                      outside: 'text-gray-300',
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : null}
      </AnimatePresence>

    </>
  )
}

