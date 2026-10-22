import {
  ArrowDown,
  BookOpen,
  Briefcase,
  Flame,
  Heart,
  Minus,
  Plane,
  Tag,
  User,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import type { Priority } from './types'

export { APP_NAME, BRAND, LIMITS } from './config'

export interface CategoryMeta {
  key: string
  label: string
  icon: LucideIcon
  /** Tailwind classes for text / soft background / solid bar. */
  text: string
  soft: string
  bar: string
}

export const CATEGORIES: CategoryMeta[] = [
  { key: 'general', label: 'ทั่วไป', icon: Tag, text: 'text-slate-600 dark:text-slate-300', soft: 'bg-slate-500/10', bar: 'bg-slate-500' },
  { key: 'career', label: 'การงาน', icon: Briefcase, text: 'text-sky-600 dark:text-sky-400', soft: 'bg-sky-500/10', bar: 'bg-sky-500' },
  { key: 'health', label: 'สุขภาพ', icon: Heart, text: 'text-rose-600 dark:text-rose-400', soft: 'bg-rose-500/10', bar: 'bg-rose-500' },
  { key: 'finance', label: 'การเงิน', icon: Wallet, text: 'text-emerald-600 dark:text-emerald-400', soft: 'bg-emerald-500/10', bar: 'bg-emerald-500' },
  { key: 'personal', label: 'ส่วนตัว', icon: User, text: 'text-violet-600 dark:text-violet-400', soft: 'bg-violet-500/10', bar: 'bg-violet-500' },
  { key: 'learning', label: 'การเรียนรู้', icon: BookOpen, text: 'text-amber-600 dark:text-amber-400', soft: 'bg-amber-500/10', bar: 'bg-amber-500' },
  { key: 'relationship', label: 'ความสัมพันธ์', icon: Users, text: 'text-pink-600 dark:text-pink-400', soft: 'bg-pink-500/10', bar: 'bg-pink-500' },
  { key: 'travel', label: 'ท่องเที่ยว', icon: Plane, text: 'text-cyan-600 dark:text-cyan-400', soft: 'bg-cyan-500/10', bar: 'bg-cyan-500' },
]

export function getCategory(key: string | null | undefined): CategoryMeta {
  return CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[0]
}

export interface PriorityMeta {
  key: Priority
  label: string
  icon: LucideIcon
  text: string
  soft: string
  order: number
}

export const PRIORITIES: PriorityMeta[] = [
  { key: 'high', label: 'สำคัญมาก', icon: Flame, text: 'text-red-600 dark:text-red-400', soft: 'bg-red-500/10', order: 0 },
  { key: 'medium', label: 'ปานกลาง', icon: Minus, text: 'text-amber-600 dark:text-amber-400', soft: 'bg-amber-500/10', order: 1 },
  { key: 'low', label: 'ไม่เร่งด่วน', icon: ArrowDown, text: 'text-slate-500 dark:text-slate-400', soft: 'bg-slate-500/10', order: 2 },
]

export function getPriority(key: Priority | null | undefined): PriorityMeta {
  return PRIORITIES.find((p) => p.key === key) ?? PRIORITIES[1]
}

export type SortKey = 'position' | 'priority' | 'target_date' | 'progress' | 'created_at'

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'position', label: 'ลำดับที่จัดเอง' },
  { key: 'priority', label: 'ความสำคัญ' },
  { key: 'target_date', label: 'กำหนดเสร็จ' },
  { key: 'progress', label: 'ความคืบหน้า' },
  { key: 'created_at', label: 'สร้างล่าสุด' },
]

export type StatusFilter = 'all' | 'active' | 'done'

export const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'active', label: 'กำลังทำ' },
  { key: 'done', label: 'สำเร็จ' },
]
