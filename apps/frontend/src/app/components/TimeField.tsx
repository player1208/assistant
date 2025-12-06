"use client"

import { useRef, useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "motion/react"
import { Clock } from "lucide-react"
import WheelTimePicker from "./WheelTimePicker"

export type TimeFieldProps = {
  value: string // HH:mm
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  // 内联模式相关
  inline?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  renderInlineWheel?: boolean
}

export default function TimeField({
  value,
  onChange,
  placeholder,
  className = "",
  inline = false,
  open: controlledOpen,
  onOpenChange,
  renderInlineWheel = false
}: TimeFieldProps) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const popRef = useRef<HTMLDivElement>(null)
  const [internalOpen, setInternalOpen] = useState(false)

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = (v: boolean) => {
    if (onOpenChange) onOpenChange(v)
    else setInternalOpen(v)
  }

  // 滚轮临时值
  const wheelTempTime = useRef(value || '09:00')

  const handleWheelChange = (newTime: string) => {
    wheelTempTime.current = newTime
  }

  // close on esc / outside (仅非内联模式)
  useEffect(() => {
    if (!open || inline) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (btnRef.current && (btnRef.current === target || btnRef.current.contains(target))) return
      if (popRef.current && popRef.current.contains(target)) return
      setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('click', onClick)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('click', onClick) }
  }, [open, inline])

  const [pos, setPos] = useState<{top:number,left:number,width:number}>({ top: 0, left: 0, width: 0 })
  const updatePos = () => {
    const el = btnRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setPos({ top: r.bottom + 6, left: Math.max(8, Math.min(r.left, window.innerWidth - 200)), width: r.width })
  }
  useEffect(() => { if (open && !inline) { updatePos(); setTimeout(updatePos, 0) } }, [open, inline])
  useEffect(() => { const h = () => open && !inline && updatePos(); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h) }, [open, inline])

  const display = value || placeholder || ''

  // 如果是渲染内联滚轮模式
  if (renderInlineWheel) {
    return (
      <div className="bg-gradient-to-b from-gray-50 to-white rounded-2xl p-4 border border-gray-200 shadow-sm">
        <div className="flex justify-center py-2">
          <WheelTimePicker
            value={value}
            onChange={handleWheelChange}
          />
        </div>
        {/* 确认和取消按钮 */}
        <div className="flex gap-3 mt-4 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={() => {
              setOpen(false)
            }}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 active:scale-[0.98]"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => {
              onChange(wheelTempTime.current)
              setOpen(false)
            }}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-xl transition-all duration-200 shadow-sm hover:shadow active:scale-[0.98]"
          >
            确认
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(!open)}
        className={("w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 cursor-pointer flex items-center justify-between gap-2 bg-white " + className).trim()}
      >
        <span className="truncate text-left flex-1">{display}</span>
        <Clock className="w-4 h-4 text-gray-500" />
      </button>

      {/* 弹出式滚轮选择器 */}
      {!inline && (
        <AnimatePresence initial={false}>
          {open && createPortal(
            <motion.div
              ref={popRef}
              className="fixed z-[200] bg-gradient-to-b from-white to-gray-50 border border-gray-200 rounded-2xl shadow-2xl p-4"
              style={{ top: pos.top, left: pos.left }}
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: 'spring', stiffness: 380, damping: 34, mass: 0.6 }}
            >
              <WheelTimePicker
                value={value}
                onChange={handleWheelChange}
              />
              {/* 确认和取消按钮 */}
              <div className="flex gap-3 mt-4 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                  }}
                  className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 active:scale-[0.98]"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChange(wheelTempTime.current)
                    setOpen(false)
                  }}
                  className="flex-1 py-2.5 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-xl transition-all duration-200 shadow-sm hover:shadow active:scale-[0.98]"
                >
                  确认
                </button>
              </div>
            </motion.div>,
            document.body
          )}
        </AnimatePresence>
      )}
    </>
  )
}

