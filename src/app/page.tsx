'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Target, TrendingUp, CheckCircle, Clock, Filter, Flame, Minus, ArrowDown, Briefcase, Heart, Wallet, User as UserIcon, BookOpen, Tag, X } from 'lucide-react'
import { toast } from 'sonner'
import { User } from '@supabase/supabase-js'
import { goalsApi, authApi, Goal } from '@/lib/supabase'
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
const APP_VERSION = '1.3.1'

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
  const deletedGoalRef = useRef<Goal | null>(null)
  const isFetchingRef = useRef(false) // 🔒 ตัวล็อคป้องกันการ fetch ซ้ำ

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

  // Handle session expired - redirect to login
  const handleSessionExpired = () => {
    setUser(null)
    setGoals([])
    toast.error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่')
  }

  // Handle API errors with proper messages
  const handleApiError = (error: unknown, fallbackMessage: string) => {
    const appError = parseError(error)
    
    if (appError.code === ErrorCodes.SESSION_EXPIRED) {
      handleSessionExpired()
      return
    }
    
    if (appError.code === ErrorCodes.NETWORK_ERROR && !isOnline()) {
      // Network status component will show the offline banner
      return
    }
    
    toast.error(appError.message || fallbackMessage)
  }

  // Auth state listener
  useEffect(() => {
    // Version check - force reload if version mismatch
    const storedVersion = localStorage.getItem('app_version')
    if (storedVersion && storedVersion !== APP_VERSION) {
      localStorage.setItem('app_version', APP_VERSION)
      // Clear all caches and force reload
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name))
        })
      }
      window.location.reload()
      return
    }
    localStorage.setItem('app_version', APP_VERSION)

    // Initialize audio on first interaction (for iOS)
    const handleFirstInteraction = () => {
      initAudio()
      document.removeEventListener('touchstart', handleFirstInteraction)
      document.removeEventListener('click', handleFirstInteraction)
    }
    document.addEventListener('touchstart', handleFirstInteraction, { once: true })
    document.addEventListener('click', handleFirstInteraction, { once: true })

    try {
      const { data: { subscription } } = authApi.onAuthStateChange((event, session) => {
        console.log('Auth Event:', event, session?.user?.id)
        const newUser = session?.user ?? null
        
        // เช็คว่า User เปลี่ยนจริงไหม? ถ้า User เดิมไม่ต้องทำอะไร
        if (user?.id === newUser?.id && event === 'INITIAL_SESSION') {
          console.log('Same user, skipping INITIAL_SESSION')
          return
        }
        
        setUser(newUser)
        if (!newUser) {
          setGoals([])
          setLoading(false)
        }
        
        // ดักจับเฉพาะ Event สำคัญ
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && newUser) {
          // ไม่ต้อง setTimeout ยาวๆ แล้ว เพราะเรามี isFetchingRef กันไว้
          fetchGoals(newUser.id)
        }
      })

      // Check initial session
      authApi.ensureValidSession().then((session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }).catch((err) => {
        console.error('Session error:', err)
        setLoading(false)
      })

      return () => subscription.unsubscribe()
    } catch (err) {
      console.error('Auth error:', err)
      setLoading(false)
    }
  }, [])

  // Re-check session when app becomes visible (iOS Safari background tab issue)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && user) {
        // เพิ่ม setTimeout เล็กน้อยเพื่อให้ Safari ตื่นตัวเต็มที่
        setTimeout(async () => {
          try {
            const session = await authApi.ensureValidSession()
            if (!session) {
              handleSessionExpired()
            } else {
              // Refresh goals data
              fetchGoals(user.id)
            }
          } catch (err) {
            console.error('Session refresh error:', err)
            // ไม่ต้อง handleSessionExpired ทันที - ให้ลอง refresh อีกครั้ง
          }
        }, 300)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [user])

  // ลบ useEffect ที่ fetch goals เมื่อ user เปลี่ยน - ให้ Auth Listener จัดการอย่างเดียว
  // เพื่อป้องกัน Race Condition บน Safari

  const fetchGoals = async (userId?: string) => {
    const uid = userId || user?.id
    
    // ⛔️ ถ้าไม่มี User หรือ "กำลังดึงข้อมูลอยู่" ให้หยุดทันที!
    if (!uid || isFetchingRef.current) {
      console.log('fetchGoals: Skipped (Already fetching or no user)')
      if (!uid) setLoading(false)
      return
    }
    
    // 🔒 ล็อคประตู!
    isFetchingRef.current = true
    console.log('fetchGoals: Locking and Starting...')
    
    try {
      const data = await goalsApi.getAll(uid)
      console.log('fetchGoals: Success, got', data?.length, 'goals')
      setGoals(data)
      setLastCompletedCount(data.filter(g => g.status).length)
    } catch (err: any) {
      console.error('Error fetching goals:', err)
      
      // 🔥 ดักจับ Session Expired แล้วสั่ง Logout เลย
      if (err?.message === 'SESSION_EXPIRED' || err?.code === 'PGRST301') {
        console.log('Session expired caught in fetchGoals -> Force Logout')
        toast.error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่')
        await authApi.signOut(true)
        setUser(null)
        setGoals([])
        return
      }
      
      // ถ้าไม่ใช่ AbortError (การยกเลิกปกติ) ค่อยแจ้งเตือน
      if (err?.name !== 'AbortError') {
        handleApiError(err, 'โหลดข้อมูลไม่สำเร็จ')
      }
    } finally {
      // 🔓 ปลดล็อคเสมอ (ไม่ว่าจะสำเร็จหรือล้มเหลว)
      isFetchingRef.current = false
      console.log('fetchGoals: Unlocked')
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await authApi.signOut(false) // ไม่ต้อง force reload - ให้ React จัดการ state
      setUser(null)
      setGoals([])
    } catch (err) {
      console.error('Sign out error:', err)
      // Force clear state anyway
      setUser(null)
      setGoals([])
    }
  }

  const handleProfileUpdate = async () => {
    try {
      const session = await authApi.getSession()
      if (session?.user) {
        setUser(session.user)
      }
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
  }) => {
    if (!user) return

    try {
      if (editingGoal) {
        const updated = await goalsApi.update(editingGoal.id, data)
        setGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)))
        toast.success('บันทึกเป้าหมายแล้ว')
      } else {
        const newGoal = await goalsApi.create({
          ...data,
          user_id: user.id,
          status: false,
          position: goals.length,
        })
        setGoals((prev) => [...prev, newGoal])
        toast.success('เพิ่มเป้าหมายใหม่แล้ว')
      }
    } catch (err) {
      console.error('Error saving goal:', err)
      handleApiError(err, 'ไม่สามารถบันทึกเป้าหมายได้ กรุณาลองใหม่')
    }
  }

  const handleToggleStatus = async (id: string, status: boolean) => {
    // Optimistic update
    const prevGoals = [...goals]
    const newGoals = goals.map((g) => (g.id === id ? { ...g, status } : g))
    setGoals(newGoals)
    
    try {
      await goalsApi.update(id, { status })
      
      // เช็คว่าครบ 100% หรือยัง
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

  const handleDeleteGoal = async (id: string) => {
    const goalToDelete = goals.find(g => g.id === id)
    if (!goalToDelete) return
    
    // เก็บไว้สำหรับ undo
    deletedGoalRef.current = goalToDelete
    
    // Optimistic update
    const prevGoals = [...goals]
    setGoals((prev) => prev.filter((g) => g.id !== id))
    
    // แสดง toast พร้อมปุ่ม undo
    toast('ลบเป้าหมายแล้ว', {
      action: {
        label: 'ยกเลิก',
        onClick: async () => {
          // Restore goal
          if (deletedGoalRef.current) {
            setGoals(prevGoals)
            deletedGoalRef.current = null
            toast.success('กู้คืนเป้าหมายแล้ว')
          }
        },
      },
      duration: 5000,
      onAutoClose: async () => {
        // ลบจริงเมื่อ toast หมดเวลา
        if (deletedGoalRef.current) {
          try {
            await goalsApi.delete(id)
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
      await goalsApi.updatePositions(
        newGoals.map((g, i) => ({ id: g.id, position: i }))
      )
    } catch (err) {
      console.error('Error reordering goals:', err)
      setGoals(prevGoals)
      handleApiError(err, 'ไม่สามารถจัดลำดับใหม่ได้')
    }
  }

  // Loading state - Skeleton
  if (loading) {
    return <SkeletonGrid />
  }

  // Auth screen
  if (!user) {
    return (
      <div className="min-h-screen min-h-[100dvh] paper-texture flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <AuthCard onSuccess={() => {}} />
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

  // Filtered goals
  const filteredGoals = goals.filter((g) => {
    if (filterCategory && g.category !== filterCategory) return false
    if (filterPriority && g.priority !== filterPriority) return false
    return true
  })

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
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl text-foreground mb-1 sm:mb-2">
                  เป้าหมายปี 2026
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {totalCount === 0
                    ? 'เริ่มต้นด้วยการเพิ่มเป้าหมายแรกของคุณ'
                    : 'ติดตามความก้าวหน้าและทำให้ปีนี้เป็นปีที่ดีที่สุด'}
                </p>
              </div>

              <div className="flex items-center gap-3 sm:gap-4">
                <Countdown />
                
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

        {/* Progress Bar */}
        {totalCount > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-4 sm:mb-6"
          >
            <div className="h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-primary to-green-500 rounded-full"
              />
            </div>
          </motion.div>
        )}

        {/* Filter Bar */}
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
        />
      </main>

      {/* Footer Credit */}
      <footer className="py-4 sm:py-6 text-center safe-area-bottom">
        <p className="text-xs sm:text-sm text-muted-foreground/60">Made by Dome</p>
      </footer>

      {/* Goal Modal */}
      <GoalModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        goal={editingGoal}
        onSave={handleSaveGoal}
      />

      {/* Share Poster Modal */}
      <SharePoster
        open={shareOpen}
        onOpenChange={setShareOpen}
        goals={goals}
        userName={userName}
        userAvatar={userAvatar}
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

      {/* Floating Add Button - Mobile only */}
      <FloatingAddButton onClick={handleAddGoal} />

      {/* Celebration Effect - 100% Complete */}
      <CelebrationEffect 
        show={showCelebration} 
        onComplete={() => setShowCelebration(false)} 
      />
    </div>
  )
}
