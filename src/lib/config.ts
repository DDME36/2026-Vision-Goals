// Pure configuration shared by server and client (no UI imports here).

export const APP_NAME = 'Vision Goals'
export const BRAND = 'Zentyr'
export const BRAND_URL = process.env.NEXT_PUBLIC_BRAND_URL || null

export const LIMITS = {
  title: 100,
  description: 1000,
  subtasks: 30,
  subtaskTitle: 120,
  username: { min: 3, max: 32 },
  password: { min: 8, max: 128 },
  displayName: 40,
} as const

export const CATEGORY_KEYS = [
  'general',
  'career',
  'health',
  'finance',
  'personal',
  'learning',
  'relationship',
  'travel',
] as const

export type CategoryKey = (typeof CATEGORY_KEYS)[number]
