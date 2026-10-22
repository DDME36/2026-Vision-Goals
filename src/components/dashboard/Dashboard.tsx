'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { HardDrive, Plus, RefreshCw, ServerCrash } from 'lucide-react'
import { toast } from 'sonner'
import type { Features } from '@/components/App'
import { errorMessage } from '@/lib/api-client'
import type { SortKey } from '@/lib/constants'
import { computeStats, EMPTY_FILTERS, filterGoals, hasActiveFilters, sortGoals, type GoalFilters } from '@/lib/goals'
import { localRepository } from '@/lib/repositories/local'
import { remoteRepository } from '@/lib/repositories/remote'
import type { AppUser, Goal, GoalInput } from '@/lib/types'
import { downloadFile, readFileAsText } from '@/lib/utils'
import { useGoals } from '@/hooks/useGoals'
import { useHotkeys } from '@/hooks/useHotkeys'
import { usePersistentState } from '@/hooks/usePersistentState'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { CelebrationEffect } from '@/components/effects/CelebrationEffect'
import { GoalBoard, type ViewMode } from '@/components/goals/GoalBoard'
import { GoalModal } from '@/components/goals/GoalModal'
import { FeedbackModal } from '@/components/modals/FeedbackModal'
import { LocalMigrationDialog } from '@/components/modals/LocalMigrationDialog'
import { ProfileModal } from '@/components/modals/ProfileModal'
import { SharePoster } from '@/components/modals/SharePoster'
import { ShortcutsDialog } from '@/components/modals/ShortcutsDialog'
import { AppHeader } from './AppHeader'
import { CategoryInsights } from './CategoryInsights'
import { HeroSection } from './HeroSection'
import { StatsOverview } from './StatsOverview'
import { Toolbar } from './Toolbar'

interface DashboardProps {
  user: AppUser
  features: Features
  onSignOut: () => void
  onSessionExpired: () => void
  onUserChange: (user: AppUser) => void
}

type ModalState =
  | { kind: 'none' }
  | { kind: 'goal'; goal: Goal | null }
  | { kind: 'share' }
  | { kind: 'profile' }
  | { kind: 'feedback' }
  | { kind: 'shortcuts' }

export function Dashboard({ user, features, onSignOut, onSessionExpired, onUserChange }: DashboardProps) {
  const isGuest = Boolean(user.isGuest)
  const repo = isGuest ? localRepository : remoteRepository
  const currentYear = new Date().getFullYear()

  const [year, setYear] = useState(currentYear)
  const [filters, setFilters] = useState<GoalFilters>(EMPTY_FILTERS)
  const [sortBy, setSortBy] = usePersistentState<SortKey>('vg-sort', 'position')
  const [view, setView] = usePersistentState<ViewMode>('vg-view', 'grid')
  const [modal, setModal] = useState<ModalState>({ kind: 'none' })
  const [celebrate, setCelebrate] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const importRef = useRef<HTMLInputElement>(null)

  const onAllCompleted = useCallback(() => setCelebrate(true), [])
  const goalsCtl = useGoals({ repo, year, onUnauthorized: onSessionExpired, onAllCompleted })
  const { goals } = goalsCtl

  const stats = useMemo(() => computeStats(goals), [goals])
  const visibleGoals = useMemo(() => sortGoals(filterGoals(goals, filters), sortBy), [goals, filters, sortBy])
  const filtering = hasActiveFilters(filters)
  const canReorder = sortBy === 'position' && !filtering

  const years = useMemo(() => {
    const set = new Set([...goalsCtl.years, currentYear, currentYear + 1, year])
    return [...set].sort((a, b) => b - a)
  }, [goalsCtl.years, currentYear, year])

  const close = () => setModal({ kind: 'none' })
  const openNewGoal = () => setModal({ kind: 'goal', goal: null })

  useHotkeys({
    n: openNewGoal,
    '/': () => searchRef.current?.focus(),
    '?': () => setModal({ kind: 'shortcuts' }),
    '[': () => setYear((y) => y - 1),
    ']': () => setYear((y) => y + 1),
  })

  const handleSaveGoal = async (input: GoalInput) => {
    if (modal.kind === 'goal' && modal.goal) return Boolean(await goalsCtl.update(modal.goal.id, input))
    return Boolean(await goalsCtl.create(input))
  }

  const handleExport = async () => {
    try {
      const data = await repo.exportAll()
      downloadFile(`vision-goals-${data.exported_at.slice(0, 10)}.json`, JSON.stringify(data, null, 2))
      toast.success(`ส่งออก ${data.goals.length} เป้าหมายแล้ว`)
    } catch (err) {
      toast.error(errorMessage(err, 'ส่งออกข้อมูลไม่สำเร็จ'))
    }
  }

  const handleImportFile = async (file: File) => {
    try {
      const parsed = JSON.parse(await readFileAsText(file))
      // Accept both our export format and a bare array (older versions / Supabase dumps).
      const items: unknown = Array.isArray(parsed) ? parsed : parsed?.goals
      if (!Array.isArray(items)) throw new Error('ไฟล์นี้ไม่ใช่ไฟล์สำรองของ Vision Goals')
      const result = await repo.importGoals(items)
      toast.success(`นำเข้า ${result.added} เป้าหมาย`, {
        description: result.skipped || result.invalid ? `ข้ามรายการซ้ำ ${result.skipped} · ไม่ถูกต้อง ${result.invalid}` : undefined,
      })
      goalsCtl.reload({ silent: true })
    } catch (err) {
      toast.error(errorMessage(err, 'นำเข้าข้อมูลไม่สำเร็จ'))
    }
  }

  return (
    <div className="app-backdrop flex min-h-dvh flex-col">
      <AppHeader
        user={user}
        onNewGoal={openNewGoal}
        onShare={() => setModal({ kind: 'share' })}
        onProfile={() => setModal({ kind: 'profile' })}
        onFeedback={features.feedback ? () => setModal({ kind: 'feedback' }) : undefined}
        onShortcuts={() => setModal({ kind: 'shortcuts' })}
        onExport={handleExport}
        onImport={() => importRef.current?.click()}
        onSignOut={onSignOut}
      />

      <main className="container flex-1 pb-28 pt-6 sm:pt-10 md:pb-12">
        <AnimatePresence>
          {isGuest && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/[0.07] p-4"
            >
              <HardDrive className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="flex-1 text-sm">
                <p className="font-medium">โหมดผู้เยี่ยมชม — ข้อมูลเก็บในเบราว์เซอร์นี้เท่านั้น</p>
                <p className="mt-0.5 text-muted-foreground">
                  สมัครบัญชีเพื่อซิงก์ข้ามอุปกรณ์ แล้วย้ายเป้าหมายที่มีอยู่ขึ้นบัญชีได้ในคลิกเดียว
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={onSignOut} className="shrink-0">
                สมัครเลย
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <HeroSection year={year} years={years} onYearChange={setYear} stats={stats} loading={goalsCtl.loading} />

        {goalsCtl.error && !goalsCtl.loading ? (
          <div className="surface mt-8 flex flex-col items-center gap-4 px-6 py-14 text-center">
            <ServerCrash className="size-10 text-muted-foreground" />
            <div>
              <p className="font-medium">โหลดเป้าหมายไม่สำเร็จ</p>
              <p className="mt-1 text-sm text-muted-foreground">{goalsCtl.error}</p>
            </div>
            <Button variant="outline" onClick={() => goalsCtl.reload()}>
              <RefreshCw />
              ลองใหม่
            </Button>
          </div>
        ) : (
          <>
            {stats.total > 0 && (
              <div className="mt-8 grid items-start gap-4 lg:grid-cols-[1fr_320px]">
                <StatsOverview stats={stats} />
                <CategoryInsights goals={goals} onSelect={(category) => setFilters((f) => ({ ...f, category }))} />
              </div>
            )}

            {stats.total > 0 && (
              <Toolbar
                ref={searchRef}
                filters={filters}
                onFiltersChange={setFilters}
                sortBy={sortBy}
                onSortChange={setSortBy}
                view={view}
                onViewChange={setView}
                resultCount={visibleGoals.length}
                totalCount={stats.total}
              />
            )}

            <GoalBoard
              goals={visibleGoals}
              loading={goalsCtl.loading}
              view={view}
              canReorder={canReorder}
              filtering={filtering}
              year={year}
              onReorder={goalsCtl.reorder}
              onToggle={goalsCtl.toggle}
              onEdit={(goal) => setModal({ kind: 'goal', goal })}
              onDelete={goalsCtl.remove}
              onDuplicate={goalsCtl.duplicate}
              onRollover={goalsCtl.rollover}
              onUpdateSubtasks={goalsCtl.updateSubtasks}
              onAdd={openNewGoal}
              onClearFilters={() => setFilters(EMPTY_FILTERS)}
            />
          </>
        )}
      </main>

      <Footer />

      {/* Mobile quick add */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileTap={{ scale: 0.92 }}
        onClick={openNewGoal}
        aria-label="เพิ่มเป้าหมายใหม่"
        className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-5 z-40 flex size-14 items-center justify-center rounded-2xl bg-brand text-brand-foreground shadow-xl shadow-brand/30 md:hidden"
      >
        <Plus className="size-6" />
      </motion.button>

      <input
        ref={importRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleImportFile(file)
          e.target.value = ''
        }}
      />

      <GoalModal
        open={modal.kind === 'goal'}
        onOpenChange={(open) => !open && close()}
        goal={modal.kind === 'goal' ? modal.goal : null}
        year={year}
        onSave={handleSaveGoal}
      />
      <SharePoster
        open={modal.kind === 'share'}
        onOpenChange={(open) => !open && close()}
        goals={goals}
        userName={user.displayName}
        userAvatar={user.avatarUrl}
        year={year}
      />
      <ProfileModal
        open={modal.kind === 'profile'}
        onOpenChange={(open) => !open && close()}
        user={user}
        onUpdated={onUserChange}
      />
      {features.feedback && <FeedbackModal open={modal.kind === 'feedback'} onOpenChange={(open) => !open && close()} />}
      <ShortcutsDialog open={modal.kind === 'shortcuts'} onOpenChange={(open) => !open && close()} />
      {!isGuest && <LocalMigrationDialog onMigrated={() => goalsCtl.reload({ silent: true })} />}

      <CelebrationEffect show={celebrate} year={year} onDone={() => setCelebrate(false)} />
    </div>
  )
}
