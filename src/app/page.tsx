'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Target, TrendingUp, CheckCircle, Clock, Filter, Flame, Minus, ArrowDown, Briefcase, Heart, Wallet, User as UserIcon, BookOpen, Tag, X, CloudOff, ChevronDown, ArrowUpDown, Calendar, SortAsc } from 'lucide-react'
import { toast } from 'sonner'
import { User } from '@supabase/supabase-js'
import { goalsApi, authApi, Goal, SubTask } from '@/lib/supabase'
import { localGoalsApi, isOfflineMode, setOfflineMode, GUEST_USER } from '@/lib/localGoals'
import { parseError, ErrorCodes, isOnline } from '@/lib/errors'
import { initAudio } from '@/lib/sounds'
import { AuthCard } from '@/components/AuthCard'
import { Header } from '@/components/Header'
import { BentoGrid } from '@/components/BentoGrid'
import { GoalModal } from '@/components/GoalModal'
import { SharePoster } from '@/components/SharePoster'
import { ProfileModal } from '@/components/ProfileModal'
import { FeedbackModal } from '@/components/FeedbackModal'
import { Countdown } from '@/components/Countdown'
import { CelebrationEffect } from '@/components/CelebrationEffect'
import { SkeletonGrid } from '@/components/SkeletonGrid'
import { FloatingAddButton } from '@/components/FloatingAddButton'

// App version - เปลี่ยนทุกครั้งที่ deploy เพื่อ force reload
const APP_VERSION = '2.0.0'

// Motivational messages based on progress
function getMotivationalMessage(percent: number, total: number): string {
  if (total === 0) return 'เริ่มต้นด้วยการเพิ่มเป้าหมายแรกของคุณ'
  if (percent === 100) return 'สุดยอด! ทำได้ครบทุกเป้าหมาย! 🎉'
  if (percent >= 76) return 'ใกล้ถึงเป้าหมายแล้ว! ⭐'
  if (percent >= 51) return 'เกินครึ่งทางแล้ว! 🚀'
  if (percent >= 26) return 'ทำได้เกือบครึ่งแล้ว! 🔥'
  if (percent >= 1) return 'เริ่มต้นได้ดีมาก! 💪'
  return 'เริ่มต้นจากก้าวแรกเสมอ ✨'
}

// Sort options
type SortKey = 'position' | 'priority' | 'target_date' | 'status' | 'created_at'
const sortOptions: { key: SortKey; label: string }[] = [
  { key: 'position', label: 'ลำดับเอง' },
  { key: 'priority', label: 'ความสำคัญ' },
  { key: 'target_date', label: 'วันที่เป้า' },
  { key: 'status', label: 'สถานะ' },
  { key: 'created_at', label: 'วันที่สร้าง' },
]

const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [lastCompletedCount, setLastCompletedCount] = useState(0)
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [filterPriority, setFilterPriority] = useState<string | null>(null)
  const [offlineMode, setOfflineModeState] = useState(false)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [availableYears, setAvailableYears] = useState<number[]>([new Date().getFullYear()])
  const [sortBy, setSortBy] = useState<SortKey>('position')
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [showYearDropdown, setShowYearDropdown] = useState(false)
  const deletedGoalRef = useRef<Goal | null>(null)
  const isFetchingRef = useRef(false)

  // Get the right API based on mode
  const activeApi = offlineMode ? localGoalsApi : goalsApi

  // Filter configs
  const categories = [
    { key: 'general', label: 'ทั่วไป', icon: Tag },
    { key: 'career', label: 'การงาน', icon: Briefcase },
    { key: 'health', label: 'สุขภาพ', icon: Heart },
    { key: 'finance', label: 'การเงิน', icon: Wallet },
    { key: 'personal', label: 'ส่วนตัว', icon: UserIcon },
    { key: 'learning', label: 'การเรียนรู้', icon: BookOpen },
  ]

  const priorities = [
    { key: 'high', label: 'สำคัญมาก', icon: Flame, color: 'text-red-500' },
    { key: 'medium', label: 'ปานกลาง', icon: Minus, color: 'text-amber-500' },
    { key: 'low', label: 'ไม่เร่งด่วน', icon: ArrowDown, color: 'text-slate-400' },
  ]

  // Handle session expired
  const handleSessionExpired = () => {
    setUser(null)
    setGoals([])
    toast.error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่')
  }

  // Handle API errors
  const handleApiError = (error: unknown, fallbackMessage: string) => {
    const appError = parseError(error)
    if (appError.code === ErrorCodes.SESSION_EXPIRED) {
      handleSessionExpired()
      return
    }
    if (appError.code === ErrorCodes.NETWORK_ERROR && !isOnline()) return
    toast.error(appError.message || fallbackMessage)
  }

  // Load available years
  const loadYears = useCallback(async (userId: string) => {
    if (offlineMode) {
      const years = await localGoalsApi.getYears(userId)
      const currentYear = new Date().getFullYear()
      if (!years.includes(currentYear)) years.push(currentYear)
      years.sort((a, b) => b - a)
      setAvailableYears(years)
    } else {
      // For Supabase, we just use current year + last 2 years
      const currentYear = new Date().getFullYear()
      setAvailableYears([currentYear, currentYear - 1, currentYear - 2].filter(y => y >= 2024))
    }
  }, [offlineMode])

  // Auth state listener
  useEffect(() => {
    // Version check
    const storedVersion = localStorage.getItem('app_version')
    if (storedVersion && storedVersion !== APP_VERSION) {
      localStorage.setItem('app_version', APP_VERSION)
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name))
        })
      }
      window.location.reload()
      return
    }
    localStorage.setItem('app_version', APP_VERSION)

    // Initialize audio
    const handleFirstInteraction = () => {
      initAudio()
      document.removeEventListener('touchstart', handleFirstInteraction)
      document.removeEventListener('click', handleFirstInteraction)
    }
    document.addEventListener('touchstart', handleFirstInteraction, { once: true })
    document.addEventListener('click', handleFirstInteraction, { once: true })

    // Check offline mode
    if (isOfflineMode()) {
      console.log('Resuming offline mode')
      setOfflineModeState(true)
      setUser(GUEST_USER as any)
      localGoalsApi.getAll(GUEST_USER.id, selectedYear).then(data => {
        setGoals(data)
        setLastCompletedCount(data.filter(g => g.status).length)
      }).finally(() => setLoading(false))
      loadYears(GUEST_USER.id)
      return
    }

    try {
      const { data: { subscription } } = authApi.onAuthStateChange((event, session) => {
        console.log('Auth Event:', event, session?.user?.id)
        const newUser = session?.user ?? null
        
        if (user?.id === newUser?.id && event === 'INITIAL_SESSION') {
          console.log('Same user, skipping INITIAL_SESSION')
          return
        }
        
        setUser(newUser)
        if (!newUser) {
          setGoals([])
          setLoading(false)
        }
        
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && newUser) {
          fetchGoals(newUser.id)
          loadYears(newUser.id)
        }
      })

      const sessionTimeout = setTimeout(() => {
        console.log('Supabase connection timeout')
        enterOfflineMode()
      }, 8000)

      authApi.ensureValidSession().then((session) => {
        clearTimeout(sessionTimeout)
        if (session?.user) {
          setUser(session.user)
        } else {
          setUser(null)
        }
        setLoading(false)
      }).catch((err) => {
        clearTimeout(sessionTimeout)
        console.error('Session error:', err)
        enterOfflineMode()
      })

      return () => {
        clearTimeout(sessionTimeout)
        subscription.unsubscribe()
      }
    } catch (err) {
      console.error('Auth error:', err)
      enterOfflineMode()
    }
  }, [])

  // Enter offline mode
  const enterOfflineMode = useCallback(() => {
    console.log('Entering offline mode')
    setOfflineMode(true)
    setOfflineModeState(true)
    setUser(GUEST_USER as any)
    localGoalsApi.getAll(GUEST_USER.id, selectedYear).then(data => {
      setGoals(data)
      setLastCompletedCount(data.filter(g => g.status).length)
    }).finally(() => setLoading(false))
    loadYears(GUEST_USER.id)
  }, [selectedYear, loadYears])

  // Refetch when year changes
  useEffect(() => {
    if (user) {
      fetchGoals(user.id)
    }
  }, [selectedYear])

  // Keyboard shortcut: Ctrl+N
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        if (user) handleAddGoal()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [user])

  // Re-check session on visibility
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && user) {
        setTimeout(async () => {
          try {
            const session = await authApi.ensureValidSession()
            if (!session) {
              handleSessionExpired()
            } else {
              fetchGoals(user.id)
            }
          } catch (err) {
            console.error('Session refresh error:', err)
          }
        }, 300)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [user])

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = () => {
      setShowSortDropdown(false)
      setShowYearDropdown(false)
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  const fetchGoals = async (userId?: string) => {
    const uid = userId || user?.id
    if (!uid || isFetchingRef.current) {
      if (!uid) setLoading(false)
      return
    }
    
    isFetchingRef.current = true
    try {
      const data = await activeApi.getAll(uid, selectedYear)
      setGoals(data)
      setLastCompletedCount(data.filter(g => g.status).length)
    } catch (err: any) {
      console.error('Error fetching goals:', err)
      if (err?.message === 'SESSION_EXPIRED' || err?.code === 'PGRST301') {
        toast.error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่')
        await authApi.signOut(true)
        setUser(null)
        setGoals([])
        return
      }
      if (!offlineMode && err?.name !== 'AbortError') {
        enterOfflineMode()
        return
      }
      if (err?.name !== 'AbortError') {
        handleApiError(err, 'โหลดข้อมูลไม่สำเร็จ')
      }
    } finally {
      isFetchingRef.current = false
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await authApi.signOut(false)
      setUser(null)
      setGoals([])
    } catch (err) {
      console.error('Sign out error:', err)
      setUser(null)
      setGoals([])
    }
  }

  const handleProfileUpdate = async () => {
    try {
      const session = await authApi.getSession()
      if (session?.user) setUser(session.user)
    } catch (err) {
      console.error('Profile update error:', err)
    }
  }

  const handleAddGoal = () => {
    setEditingGoal(null)
    setModalOpen(true)
  }

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal)
    setModalOpen(true)
  }

  const handleSaveGoal = async (data: { 
    title: string
    description: string
    category: string
    priority: 'high' | 'medium' | 'low'
    target_date?: string
    subtasks?: SubTask[]
  }) => {
    if (!user) return
    try {
      if (editingGoal) {
        const updated = await activeApi.update(editingGoal.id, {
          ...data,
          subtasks: data.subtasks || editingGoal.subtasks || [],
        })
        setGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)))
        toast.success('บันทึกเป้าหมายแล้ว')
      } else {
        const newGoal = await activeApi.create({
          ...data,
          user_id: user.id,
          status: false,
          position: goals.length,
          year: selectedYear,
          subtasks: data.subtasks || [],
        })
        setGoals((prev) => [...prev, newGoal])
        toast.success('เพิ่มเป้าหมายใหม่แล้ว')
        // Update available years
        if (!availableYears.includes(selectedYear)) {
          setAvailableYears(prev => [...prev, selectedYear].sort((a, b) => b - a))
        }
      }
    } catch (err) {
      console.error('Error saving goal:', err)
      handleApiError(err, 'ไม่สามารถบันทึกเป้าหมายได้ กรุณาลองใหม่')
    }
  }

  const handleToggleStatus = async (id: string, status: boolean) => {
    const prevGoals = [...goals]
    const newGoals = goals.map((g) => (g.id === id ? { ...g, status } : g))
    setGoals(newGoals)
    
    try {
      await activeApi.update(id, { status })
      const newCompletedCount = newGoals.filter(g => g.status).length
      const totalGoals = newGoals.length
      if (totalGoals > 0 && newCompletedCount === totalGoals && newCompletedCount > lastCompletedCount) {
        setShowCelebration(true)
      }
      setLastCompletedCount(newCompletedCount)
    } catch (err) {
      console.error('Error updating goal status:', err)
      setGoals(prevGoals)
      handleApiError(err, 'ไม่สามารถอัพเดทสถานะได้')
    }
  }

  const handleUpdateSubtasks = async (goalId: string, subtasks: SubTask[]) => {
    const prevGoals = [...goals]
    // Optimistic update
    const newGoals = goals.map(g => g.id === goalId ? { ...g, subtasks } : g)
    setGoals(newGoals)
    
    // Auto-complete goal if all subtasks are done
    const goal = newGoals.find(g => g.id === goalId)
    const allCompleted = subtasks.length > 0 && subtasks.every(s => s.completed)
    if (goal && allCompleted && !goal.status) {
      // Also mark goal as completed
      const updatedGoals = newGoals.map(g => g.id === goalId ? { ...g, status: true } : g)
      setGoals(updatedGoals)
      try {
        await activeApi.update(goalId, { subtasks, status: true })
        toast.success('ทำครบทุกรายการย่อยแล้ว ✨')
      } catch (err) {
        setGoals(prevGoals)
        handleApiError(err, 'ไม่สามารถอัพเดทได้')
      }
      return
    }

    try {
      await activeApi.update(goalId, { subtasks })
    } catch (err) {
      setGoals(prevGoals)
      handleApiError(err, 'ไม่สามารถอัพเดทรายการย่อยได้')
    }
  }

  const handleDeleteGoal = async (id: string) => {
    const goalToDelete = goals.find(g => g.id === id)
    if (!goalToDelete) return
    
    deletedGoalRef.current = goalToDelete
    const prevGoals = [...goals]
    setGoals((prev) => prev.filter((g) => g.id !== id))
    
    toast('ลบเป้าหมายแล้ว', {
      action: {
        label: 'ยกเลิก',
        onClick: async () => {
          if (deletedGoalRef.current) {
            setGoals(prevGoals)
            deletedGoalRef.current = null
            toast.success('กู้คืนเป้าหมายแล้ว')
          }
        },
      },
      duration: 5000,
      onAutoClose: async () => {
        if (deletedGoalRef.current) {
          try {
            await activeApi.delete(id)
            deletedGoalRef.current = null
          } catch (err) {
            console.error('Error deleting goal:', err)
            setGoals(prevGoals)
            handleApiError(err, 'ไม่สามารถลบเป้าหมายได้')
          }
        }
      },
    })
  }

  const handleReorder = async (newGoals: Goal[]) => {
    const prevGoals = [...goals]
    setGoals(newGoals)
    try {
      await activeApi.updatePositions(
        newGoals.map((g, i) => ({ id: g.id, position: i }))
      )
    } catch (err) {
      console.error('Error reordering goals:', err)
      setGoals(prevGoals)
      handleApiError(err, 'ไม่สามารถจัดลำดับใหม่ได้')
    }
  }

  const handleRollover = async (goal: Goal) => {
    if (!user) return
    const nextYear = selectedYear + 1
    
    // Copy only uncompleted subtasks
    const uncompletedSubtasks = (goal.subtasks || []).filter(st => !st.completed)

    try {
      await activeApi.create({
        title: goal.title,
        description: goal.description || '',
        category: goal.category || 'general',
        priority: goal.priority || 'medium',
        user_id: user.id,
        status: false,
        position: goals.length,
        year: nextYear,
        subtasks: uncompletedSubtasks.map(st => ({ ...st, id: crypto.randomUUID() })),
      })

      toast.success(`ยกยอดเป้าหมายไปปี ${nextYear} แล้ว`)
      
      // Update available years if needed
      if (!availableYears.includes(nextYear)) {
        setAvailableYears(prev => [...prev, nextYear].sort((a, b) => b - a))
      }
    } catch (err) {
      console.error('Error rolling over goal:', err)
      handleApiError(err, 'ไม่สามารถยกยอดเป้าหมายได้')
    }
  }

  // Export handler
  const handleExport = () => {
    if (!offlineMode) {
      toast.info('Export ใช้ได้เฉพาะโหมดออฟไลน์')
      return
    }
    const allGoals = localGoalsApi.exportAllGoals()
    const blob = new Blob([JSON.stringify(allGoals, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vision-goals-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`ส่งออกเป้าหมาย ${allGoals.length} รายการแล้ว`)
  }

  // Import handler
  const handleImport = (file: File) => {
    if (!offlineMode) {
      toast.info('Import ใช้ได้เฉพาะโหมดออฟไลน์')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string)
        if (!Array.isArray(imported)) {
          toast.error('ไฟล์ไม่ถูกต้อง')
          return
        }
        const result = localGoalsApi.importGoals(imported)
        toast.success(`นำเข้า ${result.added} รายการ (ข้าม ${result.skipped} รายการที่ซ้ำ)`)
        // Refresh
        fetchGoals(user?.id)
        loadYears(user?.id || GUEST_USER.id)
      } catch {
        toast.error('ไม่สามารถอ่านไฟล์ได้ กรุณาตรวจสอบว่าเป็นไฟล์ JSON ที่ถูกต้อง')
      }
    }
    reader.readAsText(file)
  }

  // Loading state
  if (loading) {
    return <SkeletonGrid />
  }

  // Auth screen
  if (!user) {
    return (
      <div className="min-h-screen min-h-[100dvh] paper-texture flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md space-y-4">
            <AuthCard onSuccess={() => {}} />
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              onClick={enterOfflineMode}
              className="w-full py-3 text-sm text-muted-foreground hover:text-foreground border border-dashed border-border rounded-xl hover:border-muted-foreground transition-all flex items-center justify-center gap-2"
            >
              <CloudOff className="w-4 h-4" />
              ใช้แบบไม่ล็อกอิน (เก็บในเครื่อง)
            </motion.button>
          </div>
        </div>
        <footer className="py-4 text-center safe-area-bottom">
          <p className="text-sm text-muted-foreground/50">Made by Dome</p>
        </footer>
      </div>
    )
  }

  // Stats
  const completedCount = goals.filter((g) => g.status).length
  const totalCount = goals.length
  const highPriorityCount = goals.filter((g) => g.priority === 'high' && !g.status).length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  // Sort goals
  const sortGoals = (goalsToSort: Goal[]): Goal[] => {
    if (sortBy === 'position') return goalsToSort
    return [...goalsToSort].sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          return (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1)
        case 'target_date':
          if (!a.target_date && !b.target_date) return 0
          if (!a.target_date) return 1
          if (!b.target_date) return -1
          return a.target_date.localeCompare(b.target_date)
        case 'status':
          return (a.status ? 1 : 0) - (b.status ? 1 : 0)
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        default:
          return 0
      }
    })
  }

  // Filtered & sorted goals
  const filteredGoals = sortGoals(goals.filter((g) => {
    if (filterCategory && g.category !== filterCategory) return false
    if (filterPriority && g.priority !== filterPriority) return false
    return true
  }))

  const hasActiveFilters = filterCategory || filterPriority

  // User info
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const userAvatar = user?.user_metadata?.avatar_url

  return (
    <div className="min-h-screen min-h-[100dvh] paper-texture flex flex-col">
      <Header 
        user={user} 
        onSignOut={handleSignOut} 
        onShare={() => setShareOpen(true)} 
        onEditProfile={() => setProfileOpen(true)}
        onFeedback={() => setFeedbackOpen(true)}
      />

      <main className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Offline Mode Banner */}
        <AnimatePresence>
          {offlineMode && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="mb-4 sm:mb-6"
            >
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4 flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                  <CloudOff className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-800">โหมดออฟไลน์</p>
                  <p className="text-xs text-amber-600 mt-0.5">ข้อมูลจะถูกเก็บไว้ในเครื่องของคุณ ใช้ปุ่ม Export เพื่อสำรองข้อมูล</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                {/* Title + Year Selector */}
                <div className="flex items-center gap-2 mb-1 sm:mb-2">
                  <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl text-foreground">
                    เป้าหมายปี
                  </h2>
                  {/* Year Dropdown */}
                  <div className="relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowYearDropdown(prev => !prev) }}
                      className="inline-flex items-center gap-1 font-display text-2xl sm:text-3xl lg:text-4xl text-primary hover:text-primary/80 transition-colors"
                    >
                      {selectedYear}
                      <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <AnimatePresence>
                      {showYearDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -5, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -5, scale: 0.95 }}
                          className="absolute top-full left-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-30 overflow-hidden min-w-[100px]"
                        >
                          {availableYears.map(y => (
                            <button
                              key={y}
                              onClick={(e) => { e.stopPropagation(); setSelectedYear(y); setShowYearDropdown(false) }}
                              className={`w-full px-4 py-2.5 text-sm text-left hover:bg-accent transition-colors ${
                                y === selectedYear ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'
                              }`}
                            >
                              {y}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {getMotivationalMessage(progressPercent, totalCount)}
                </p>
              </div>

              <div className="flex items-center gap-3 sm:gap-4">
                <Countdown year={selectedYear} />
                
                {totalCount > 0 && completedCount === totalCount && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-green-50 border border-green-200 rounded-full"
                  >
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
                    <span className="text-xs sm:text-sm font-medium text-green-700">สำเร็จ!</span>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        {totalCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-6 sm:mb-8"
          >
            <div className="bg-card border border-border rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground mb-1">
                <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="text-[10px] sm:text-xs">เป้าหมายทั้งหมด</span>
              </div>
              <p className="font-sans text-xl sm:text-2xl font-semibold">{totalCount}</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-1.5 sm:gap-2 text-green-600 mb-1">
                <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="text-[10px] sm:text-xs">สำเร็จแล้ว</span>
              </div>
              <p className="font-sans text-xl sm:text-2xl font-semibold text-green-600">{completedCount}</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-1.5 sm:gap-2 text-red-500 mb-1">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="text-[10px] sm:text-xs">สำคัญมาก</span>
              </div>
              <p className="font-sans text-xl sm:text-2xl font-semibold text-red-500">{highPriorityCount}</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-1.5 sm:gap-2 text-primary mb-1">
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="text-[10px] sm:text-xs">ความคืบหน้า</span>
              </div>
              <p className="font-sans text-xl sm:text-2xl font-semibold">{progressPercent}%</p>
            </div>
          </motion.div>
        )}

        {/* Progress Bar + Ring */}
        {totalCount > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-4 sm:mb-6 flex items-center gap-4"
          >
            <div className="relative flex-shrink-0">
              <svg className="w-14 h-14 sm:w-16 sm:h-16 -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="3"
                />
                <motion.path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={progressPercent === 100 ? '#22c55e' : 'hsl(var(--primary))'}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="100"
                  initial={{ strokeDashoffset: 100 }}
                  animate={{ strokeDashoffset: 100 - progressPercent }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs sm:text-sm font-semibold">{progressPercent}%</span>
            </div>

            <div className="flex-1">
              <div className="h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-primary to-green-500 rounded-full"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {completedCount} จาก {totalCount} เป้าหมาย
              </p>
            </div>
          </motion.div>
        )}

        {/* Filter & Sort Bar */}
        {totalCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-4 sm:mb-6"
          >
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Filter className="w-3.5 h-3.5" />
                <span className="text-xs">กรอง:</span>
              </div>
              
              {/* Category Filters */}
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => {
                  const Icon = cat.icon
                  const isActive = filterCategory === cat.key
                  return (
                    <button
                      key={cat.key}
                      onClick={() => setFilterCategory(isActive ? null : cat.key)}
                      className={`flex items-center gap-1 px-2 py-1 text-xs rounded-full border transition-all ${
                        isActive
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-card border-border hover:border-muted-foreground text-muted-foreground'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {cat.label}
                    </button>
                  )
                })}
              </div>

              <div className="w-px h-4 bg-border hidden sm:block" />

              {/* Priority Filters */}
              <div className="flex flex-wrap gap-1.5">
                {priorities.map((p) => {
                  const Icon = p.icon
                  const isActive = filterPriority === p.key
                  return (
                    <button
                      key={p.key}
                      onClick={() => setFilterPriority(isActive ? null : p.key)}
                      className={`flex items-center gap-1 px-2 py-1 text-xs rounded-full border transition-all ${
                        isActive
                          ? 'bg-primary text-primary-foreground border-primary'
                          : `bg-card border-border hover:border-muted-foreground ${p.color}`
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                    </button>
                  )
                })}
              </div>

              <div className="w-px h-4 bg-border hidden sm:block" />

              {/* Sort Dropdown */}
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowSortDropdown(prev => !prev) }}
                  className="flex items-center gap-1 px-2 py-1 text-xs rounded-full border bg-card border-border hover:border-muted-foreground text-muted-foreground transition-all"
                >
                  <ArrowUpDown className="w-3 h-3" />
                  <span>{sortOptions.find(s => s.key === sortBy)?.label}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
                <AnimatePresence>
                  {showSortDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -5, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -5, scale: 0.95 }}
                      className="absolute top-full left-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-30 overflow-hidden min-w-[140px]"
                    >
                      {sortOptions.map(opt => (
                        <button
                          key={opt.key}
                          onClick={(e) => { e.stopPropagation(); setSortBy(opt.key); setShowSortDropdown(false) }}
                          className={`w-full px-3 py-2 text-xs text-left hover:bg-accent transition-colors ${
                            sortBy === opt.key ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setFilterCategory(null)
                    setFilterPriority(null)
                  }}
                  className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                >
                  <X className="w-3 h-3" />
                  ล้าง
                </button>
              )}

              {/* Filter Result Count */}
              {hasActiveFilters && (
                <span className="text-xs text-muted-foreground ml-auto">
                  แสดง {filteredGoals.length} จาก {totalCount}
                </span>
              )}
            </div>
          </motion.div>
        )}

        {/* Bento Grid */}
        <BentoGrid
          goals={filteredGoals}
          onReorder={handleReorder}
          onToggleStatus={handleToggleStatus}
          onEdit={handleEditGoal}
          onDelete={handleDeleteGoal}
          onAddNew={handleAddGoal}
          onUpdateSubtasks={handleUpdateSubtasks}
          onRollover={handleRollover}
        />
      </main>

      {/* Footer */}
      <footer className="py-4 sm:py-6 text-center safe-area-bottom">
        <p className="text-xs sm:text-sm text-muted-foreground/60">Made by Dome</p>
      </footer>

      {/* Goal Modal */}
      <GoalModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        goal={editingGoal}
        selectedYear={selectedYear}
        onSave={handleSaveGoal}
      />

      {/* Share Poster */}
      <SharePoster
        open={shareOpen}
        onOpenChange={setShareOpen}
        goals={goals}
        userName={userName}
        userAvatar={userAvatar}
        year={selectedYear}
      />

      {/* Profile Modal */}
      <ProfileModal
        open={profileOpen}
        onOpenChange={setProfileOpen}
        currentName={userName}
        currentAvatar={userAvatar}
        onUpdate={handleProfileUpdate}
      />

      {/* Feedback Modal */}
      <FeedbackModal
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
      />

      {/* Floating Add Button */}
      <FloatingAddButton onClick={handleAddGoal} />

      {/* Celebration Effect */}
      <CelebrationEffect 
        show={showCelebration} 
        onComplete={() => setShowCelebration(false)} 
      />
    </div>
  )
}
