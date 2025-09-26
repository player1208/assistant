import { motion } from 'motion/react'
import { useId } from 'react'

export type SmoothTabsProps = {
  items: string[]
  activeIndex: number
  onChange: (index: number) => void
  colors?: string[] // optional palette, will cycle if shorter than items
  className?: string
  itemClassName?: string
}

export default function SmoothTabs({ items, activeIndex, onChange, colors, className = '', itemClassName = '' }: SmoothTabsProps) {
  const layoutId = useId().replace(/[:]/g, '') + '-smooth-pill'
  const palette = colors && colors.length > 0
    ? colors
    : ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed', '#06b6d4', '#f43f5e']

  return (
    <div className={"relative inline-flex items-center p-1 bg-gray-200/80 rounded-lg text-sm " + className}>
      {items.map((label, idx) => {
        const isActive = idx === activeIndex
        return (
          <button
            key={label + idx}
            type="button"
            onClick={() => onChange(idx)}
            className={"relative px-4 py-1 rounded-md min-w-[3rem] text-center cursor-pointer select-none " + itemClassName}
          >
            {isActive && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-md shadow"
                style={{ backgroundColor: palette[idx % palette.length] }}
                transition={{ type: 'spring', stiffness: 500, damping: 32, mass: 0.6 }}
              />
            )}
            <motion.span
              className="relative z-10 font-medium"
              animate={{ color: isActive ? '#ffffff' : '#374151' }}
              transition={{ duration: 0.2 }}
            >
              {label}
            </motion.span>
          </button>
        )
      })}
    </div>
  )
}

