'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { errorMessage, isUnauthorized } from '@/lib/api-client'
import type { GoalsRepository } from '@/lib/repositories/types'
import type { Goal, GoalInput, SubTask } from '@/lib/types'

const UNDO_MS = 5000

interface Options {
  repo: GoalsRepository
  year: number
  onUnauthorized: () => void
  /** Fired when a toggle makes every goal of the year complete. */
  onAllCompleted?: () => void
}

export function useGoals({ repo, year, onUnauthorized, onAllCompleted }: Options) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [years, setYears] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const goalsRef = useRef(goals)
  useLayoutEffect(() => {
    goalsRef.current = goals
  }, [goals])
  const pendingDeletes = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  const fail = useCallback(
    (err: unknown, fallback: string) => {
      if (isUnauthorized(err)) {
        toast.error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่')
        onUnauthorized()
        return
      }
      toast.error(errorMessage(err, fallback))
    },
    [onUnauthorized],
  )

  const load = useCallback(
    async (opts: { silent?: boolean } = {}) => {
      if (!opts.silent) setLoading(true)
      try {
        const data = await repo.list(year)
        // Hide goals whose delete is still waiting on the undo window.
        setGoals(data.goals.filter((g) => !pendingDeletes.current.has(g.id)))
        setYears(data.years)
        setError(null)
      } catch (err) {
        if (isUnauthorized(err)) return onUnauthorized()
        setError(errorMessage(err, 'โหลดข้อมูลไม่สำเร็จ'))
      } finally {
        setLoading(false)
      }
    },
    [repo, year, onUnauthorized],
  )

  useEffect(() => {
    load()
  }, [load])

  // Refresh quietly when the tab regains focus (e.g. edits made on another device).
  useEffect(() => {
    if (repo.kind !== 'remote') return
    const onVisible = () => document.visibilityState === 'visible' && load({ silent: true })
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [repo, load])

  /** Applies an optimistic change, persists it, and rolls back on failure. */
  const optimistic = useCallback(
    async (id: string, change: Partial<Goal>, persist: () => Promise<Goal>, fallback: string) => {
      const previous = goalsRef.current
      setGoals((list) => list.map((g) => (g.id === id ? { ...g, ...change } : g)))
      try {
        const saved = await persist()
        setGoals((list) => list.map((g) => (g.id === id ? saved : g)))
        return saved
      } catch (err) {
        setGoals(previous)
        fail(err, fallback)
        return null
      }
    },
    [fail],
  )

  const create = useCallback(
    async (input: GoalInput) => {
      try {
        const goal = await repo.create({ ...input, year })
        setGoals((list) => [...list, goal])
        setYears((ys) => (ys.includes(year) ? ys : [...ys, year]))
        toast.success('เพิ่มเป้าหมายใหม่แล้ว')
        return goal
      } catch (err) {
        fail(err, 'เพิ่มเป้าหมายไม่สำเร็จ')
        return null
      }
    },
    [repo, year, fail],
  )

  const update = useCallback(
    async (id: string, input: GoalInput) => {
      const saved = await optimistic(id, input, () => repo.update(id, input), 'บันทึกไม่สำเร็จ')
      if (saved) toast.success('บันทึกการเปลี่ยนแปลงแล้ว')
      return saved
    },
    [repo, optimistic],
  )

  const checkAllDone = useCallback(
    (id: string, status: boolean) => {
      if (!status) return
      const list = goalsRef.current
      if (list.length > 0 && list.every((g) => g.id === id || g.status)) onAllCompleted?.()
    },
    [onAllCompleted],
  )

  const toggle = useCallback(
    async (id: string, status: boolean) => {
      checkAllDone(id, status)
      await optimistic(id, { status }, () => repo.update(id, { status }), 'อัปเดตสถานะไม่สำเร็จ')
    },
    [repo, optimistic, checkAllDone],
  )

  const updateSubtasks = useCallback(
    async (id: string, subtasks: SubTask[]) => {
      const goal = goalsRef.current.find((g) => g.id === id)
      const allDone = subtasks.length > 0 && subtasks.every((s) => s.completed)
      const completeGoal = Boolean(goal && allDone && !goal.status)
      const patch = completeGoal ? { subtasks, status: true } : { subtasks }
      if (completeGoal) checkAllDone(id, true)
      const saved = await optimistic(id, patch, () => repo.update(id, patch), 'อัปเดตรายการย่อยไม่สำเร็จ')
      if (saved && completeGoal) toast.success('ทำครบทุกรายการย่อย — เป้าหมายสำเร็จแล้ว ✨')
    },
    [repo, optimistic, checkAllDone],
  )

  const remove = useCallback(
    (id: string) => {
      const goal = goalsRef.current.find((g) => g.id === id)
      if (!goal) return
      setGoals((list) => list.filter((g) => g.id !== id))

      const commit = async () => {
        pendingDeletes.current.delete(id)
        try {
          await repo.remove(id)
        } catch (err) {
          setGoals((list) => [...list, goal].sort((a, b) => a.position - b.position))
          fail(err, 'ลบเป้าหมายไม่สำเร็จ')
        }
      }
      pendingDeletes.current.set(id, setTimeout(commit, UNDO_MS))

      toast('ลบเป้าหมายแล้ว', {
        description: goal.title,
        duration: UNDO_MS,
        action: {
          label: 'เลิกทำ',
          onClick: () => {
            clearTimeout(pendingDeletes.current.get(id))
            pendingDeletes.current.delete(id)
            setGoals((list) => [...list, goal].sort((a, b) => a.position - b.position))
          },
        },
      })
    },
    [repo, fail],
  )

  // Flush pending deletes if the page is closed during the undo window.
  useEffect(() => {
    const pending = pendingDeletes.current
    const flush = () => {
      for (const [id, timer] of pending) {
        clearTimeout(timer)
        if (repo.kind === 'remote') {
          fetch(`/api/goals/${id}`, { method: 'DELETE', keepalive: true, credentials: 'same-origin' })
        } else {
          repo.remove(id)
        }
      }
      pending.clear()
    }
    window.addEventListener('pagehide', flush)
    return () => {
      window.removeEventListener('pagehide', flush)
      flush()
    }
  }, [repo])

  const reorder = useCallback(
    async (ordered: Goal[]) => {
      const previous = goalsRef.current
      setGoals(ordered.map((g, position) => ({ ...g, position })))
      try {
        await repo.reorder(ordered.map((g) => g.id))
      } catch (err) {
        setGoals(previous)
        fail(err, 'จัดลำดับใหม่ไม่สำเร็จ')
      }
    },
    [repo, fail],
  )

  const duplicate = useCallback(
    async (goal: Goal) => {
      try {
        const copy = await repo.create({
          title: `${goal.title} (สำเนา)`.slice(0, 100),
          description: goal.description,
          category: goal.category,
          priority: goal.priority,
          target_date: goal.target_date,
          subtasks: goal.subtasks.map((s) => ({ ...s, id: crypto.randomUUID(), completed: false })),
          year,
        })
        setGoals((list) => [...list, copy])
        toast.success('ทำสำเนาเป้าหมายแล้ว')
      } catch (err) {
        fail(err, 'ทำสำเนาไม่สำเร็จ')
      }
    },
    [repo, year, fail],
  )

  /** Copies an unfinished goal (with its open subtasks) into the next year. */
  const rollover = useCallback(
    async (goal: Goal) => {
      const nextYear = goal.year + 1
      try {
        await repo.create({
          title: goal.title,
          description: goal.description,
          category: goal.category,
          priority: goal.priority,
          target_date: null,
          subtasks: goal.subtasks.filter((s) => !s.completed).map((s) => ({ ...s, id: crypto.randomUUID() })),
          year: nextYear,
        })
        setYears((ys) => (ys.includes(nextYear) ? ys : [...ys, nextYear]))
        toast.success(`ยกยอดไปปี ${nextYear} แล้ว`)
      } catch (err) {
        fail(err, 'ยกยอดเป้าหมายไม่สำเร็จ')
      }
    },
    [repo, fail],
  )

  return {
    goals,
    years,
    loading,
    error,
    reload: load,
    create,
    update,
    toggle,
    updateSubtasks,
    remove,
    reorder,
    duplicate,
    rollover,
  }
}

export type GoalsController = ReturnType<typeof useGoals>
