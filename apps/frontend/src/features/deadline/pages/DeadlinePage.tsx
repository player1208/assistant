import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, LayoutGroup } from 'motion/react'
import WeekHeader from '../components/WeekHeader'
import WeekView from '../components/WeekView'
import FloatingAddButton from '../components/FloatingAddButton'
import CreateDeadlineForm from '../components/CreateDeadlineForm'
import ComposeMode from '../components/ComposeMode'
import { ComposeModeProvider, useComposeMode } from '../context/ComposeModeContext'
import { Deadline } from '../model'
import { deadlineApi } from '../../../services/api/deadline'

type FormData = {
  title: string
  description: string
  startDate: string
  deadlineDate: string
  themeColor: string
}

function DeadlinePageContent() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [editingDeadlineModal, setEditingDeadlineModal] = useState<Deadline | null>(null)
  const { isComposeMode, isTransitioning, isExiting, enterComposeMode, exitComposeMode } = useComposeMode()

  const navigate = useNavigate()

  useEffect(() => {
    const fetchDeadlines = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await deadlineApi.getAll()
        setDeadlines(data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '获取 Deadline 失败'
        setError(errorMessage)
        console.error('Failed to fetch deadlines:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchDeadlines()
  }, [])

  const calculateDeadlineListWidth = () => {
    const viewportWidth = window.innerWidth
    const fixedSpacing = 10 + 16 + 16 + 10
    const availableWidth = viewportWidth - fixedSpacing
    const unitWidth = availableWidth / 6
    return Math.floor(unitWidth * 4) - 16
  }

  const [deadlineListWidth, setDeadlineListWidth] = useState(calculateDeadlineListWidth())

  useEffect(() => {
    const handleResize = () => {
      setDeadlineListWidth(calculateDeadlineListWidth())
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleSaveDeadline = async (formData: FormData) => {
    try {
      const newDeadline = await deadlineApi.create({
        title: formData.title,
        description: formData.description || undefined,
        startDate: formData.startDate,
        deadlineDate: formData.deadlineDate,
        themeColor: formData.themeColor,
        strategyType: 'monitor',
      })
      setDeadlines(prev => [...prev, newDeadline])
      setShowModal(false)
      setEditingDeadlineModal(null)
    } catch (err) {
      console.error('Failed to save deadline:', err)
      alert('保存 Deadline 失败，请重试')
    }
  }

  const handleUpdateDeadline = async (id: string, formData: FormData) => {
    try {
      const updated = await deadlineApi.update(id, {
        title: formData.title,
        description: formData.description || undefined,
        startDate: formData.startDate,
        deadlineDate: formData.deadlineDate,
        themeColor: formData.themeColor,
      })
      setDeadlines(prev => prev.map(d => d.id === id ? updated : d))
      setEditingDeadlineModal(null)
    } catch (err) {
      console.error('Failed to update deadline:', err)
      alert('更新 Deadline 失败，请重试')
    }
  }

  const handleDeleteDeadline = async (id: string) => {
    try {
      await deadlineApi.delete(id)
      setDeadlines(prev => prev.filter(d => d.id !== id))
      setEditingDeadlineModal(null)
    } catch (err) {
      console.error('Failed to delete deadline:', err)
      alert('删除 Deadline 失败，请重试')
    }
  }

  const handleToggleDeadline = async (id: string) => {
    try {
      const updated = await deadlineApi.update(id, {
        status: deadlines.find(d => d.id === id)?.status === 'completed' ? 'active' : 'completed'
      })
      setDeadlines(prev => prev.map(d => d.id === id ? updated : d))
    } catch (err) {
      console.error('Failed to toggle deadline:', err)
      alert('切换 Deadline 状态失败，请重试')
    }
  }

  const handleAddToSchedule = (deadline: Deadline) => {
    navigate('/schedule', {
      state: {
        prefillTask: {
          title: deadline.title,
          description: deadline.description,
          date: deadline.deadlineDate,
          fromDeadline: deadline.id
        }
      }
    })
  }

  const currentWidth = window.innerWidth
  const shouldUseComposeMode = currentWidth >= 1280

  const handleAddClick = () => {
    if (shouldUseComposeMode) {
      enterComposeMode()
    } else {
      setEditingDeadlineModal(null)
      setShowModal(true)
    }
  }

  const handleComposeExit = () => {
    exitComposeMode()
  }

  const isInComposeMode = (isComposeMode || isExiting) && shouldUseComposeMode

  return (
    <LayoutGroup>
      <div className="h-full w-full flex flex-col overflow-hidden">
        {isInComposeMode ? (
          <>
            <div className="flex-1 min-h-0 flex w-full overflow-visible">
              <ComposeMode
                deadlines={deadlines}
                weekOffset={weekOffset}
                onWeekChange={setWeekOffset}
                onDeleteDeadline={handleDeleteDeadline}
                onToggleDeadline={handleToggleDeadline}
                onSaveDeadline={handleSaveDeadline}
                onUpdateDeadline={handleUpdateDeadline}
                onAddToSchedule={handleAddToSchedule}
              />
            </div>

            <motion.button
              layoutId="floating-add-button"
              onClick={handleComposeExit}
              className="fixed w-12 h-12 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg z-30 flex items-center justify-center"
              style={{
                bottom: '24px',
                left: `${Math.floor((currentWidth - 28 - 32) * 0.65) - 60}px`,
                opacity: isTransitioning ? 0.6 : 1,
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="退出谱曲模式"
            >
              <span className="text-lg">✓</span>
            </motion.button>
          </>
        ) : (
          <>
            <motion.div
              layoutId="deadline-list-card"
              className="bg-white shadow-xl rounded-lg text-[15px] flex flex-col"
              initial={false}
              animate={{
                opacity: 1,
                y: 0,
                x: 0,
                filter: 'blur(0)',
                transition: {
                  duration: 0.5,
                  ease: [0.4, 0, 0.2, 1]
                }
              }}
              layout
              style={{
                width: deadlineListWidth,
                maxWidth: '100%',
                height: 'calc(100vh - 88px)', // NavBar 56px + padding 32px
                marginLeft: 'auto',
                marginRight: 'auto',
                opacity: isTransitioning ? 0.85 : 1,
                filter: isTransitioning ? 'blur(1px)' : 'blur(0)',
                transition: isTransitioning ? 'opacity 2.5s ease, filter 2.5s ease' : 'none'
              }}
            >
              {/* 固定头部区域 */}
              <div className="flex-shrink-0">
                <WeekHeader
                  weekOffset={weekOffset}
                  onPrevWeek={() => setWeekOffset(prev => prev - 1)}
                  onNextWeek={() => setWeekOffset(prev => prev + 1)}
                  onToday={() => setWeekOffset(0)}
                />
              </div>

              {/* 可滚动的周视图区域 */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                <WeekView
                  deadlines={deadlines}
                  weekOffset={weekOffset}
                  onDeadlineClick={() => {}}
                  onToggleDeadline={handleToggleDeadline}
                />
              </div>
            </motion.div>

            <motion.div
              layoutId="floating-add-button"
              className="fixed bottom-8 z-30"
              style={{
                right: `max(1.5rem, calc(50vw - ${deadlineListWidth / 2}px - 4rem))`
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: 1,
                scale: 1,
                transition: {
                  delay: 0.3,
                  type: "spring",
                  stiffness: 300,
                  damping: 20
                }
              }}
            >
              <FloatingAddButton onClick={handleAddClick} />
            </motion.div>

            <AnimatePresence>
              {showModal && (
                <CreateDeadlineForm
                  onClose={() => setShowModal(false)}
                  onSave={handleSaveDeadline}
                  onDelete={handleDeleteDeadline}
                  onAddToSchedule={handleAddToSchedule}
                  editingDeadline={editingDeadlineModal}
                />
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </LayoutGroup>
  )
}

export default function DeadlinePage() {
  return (
    <ComposeModeProvider>
      <DeadlinePageContent />
    </ComposeModeProvider>
  )
}
