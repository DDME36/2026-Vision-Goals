import { z } from 'zod'
import { CATEGORY_KEYS, LIMITS } from './config'

const trimmed = (max: number) => z.string().trim().max(max)

export const subtaskSchema = z.object({
  id: z.string().min(1).max(64),
  title: trimmed(LIMITS.subtaskTitle).min(1),
  completed: z.boolean(),
})

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'รูปแบบวันที่ไม่ถูกต้อง')
  .nullable()

const goalFields = {
  title: trimmed(LIMITS.title).min(1, 'กรุณากรอกชื่อเป้าหมาย'),
  description: trimmed(LIMITS.description).default(''),
  category: z.enum(CATEGORY_KEYS).catch('general'),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  target_date: isoDate.optional().transform((v) => v ?? null),
  subtasks: z.array(subtaskSchema).max(LIMITS.subtasks).default([]),
}

export const createGoalSchema = z.object({
  ...goalFields,
  year: z.number().int().min(2000).max(2100),
})

export const updateGoalSchema = z
  .object({
    title: goalFields.title,
    description: trimmed(LIMITS.description),
    category: z.enum(CATEGORY_KEYS),
    priority: z.enum(['high', 'medium', 'low']),
    target_date: isoDate,
    subtasks: z.array(subtaskSchema).max(LIMITS.subtasks),
    status: z.boolean(),
    year: z.number().int().min(2000).max(2100),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'ไม่มีข้อมูลที่จะอัปเดต')

export const reorderSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(1000),
})

/** Lenient schema for imported goals (from older exports or the guest mode). */
export const importGoalSchema = z.object({
  title: trimmed(LIMITS.title).min(1),
  description: z.string().max(LIMITS.description).nullish().transform((v) => v?.trim() ?? ''),
  status: z.boolean().catch(false),
  priority: z.enum(['high', 'medium', 'low']).catch('medium'),
  category: z.enum(CATEGORY_KEYS).catch('general'),
  position: z.number().int().catch(0),
  year: z.number().int().min(2000).max(2100).catch(new Date().getFullYear()),
  target_date: z
    .string()
    .nullish()
    .transform((v) => (v && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : null)),
  subtasks: z.array(subtaskSchema).max(LIMITS.subtasks).catch([]),
  created_at: z.string().datetime({ offset: true }).optional().catch(undefined),
})

export const importSchema = z.object({
  goals: z.array(z.unknown()).max(2000),
})

export const usernameSchema = z
  .string()
  .trim()
  .min(LIMITS.username.min, `ชื่อผู้ใช้ต้องมีอย่างน้อย ${LIMITS.username.min} ตัวอักษร`)
  .max(LIMITS.username.max, `ชื่อผู้ใช้ยาวได้ไม่เกิน ${LIMITS.username.max} ตัวอักษร`)
  .regex(/^[a-zA-Z0-9._-]+$/, 'ชื่อผู้ใช้ใช้ได้เฉพาะ a-z, 0-9, จุด, ขีด และขีดล่าง')

export const passwordSchema = z
  .string()
  .min(LIMITS.password.min, `รหัสผ่านต้องมีอย่างน้อย ${LIMITS.password.min} ตัวอักษร`)
  .max(LIMITS.password.max, 'รหัสผ่านยาวเกินไป')

export const loginSchema = z.object({
  username: z.string().trim().min(1).max(LIMITS.username.max),
  password: z.string().min(1).max(LIMITS.password.max),
})

export const registerSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  displayName: trimmed(LIMITS.displayName).optional(),
})

// Cropped avatars are 256px JPEGs (~20-40KB). Cap generously at ~300KB of base64.
const avatarSchema = z
  .string()
  .max(400_000, 'รูปมีขนาดใหญ่เกินไป')
  .regex(/^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/, 'รูปแบบรูปภาพไม่ถูกต้อง')

export const profileSchema = z.object({
  displayName: trimmed(LIMITS.displayName).min(1, 'กรุณากรอกชื่อที่แสดง'),
  avatarUrl: avatarSchema.nullable().optional(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(LIMITS.password.max),
  newPassword: passwordSchema,
})

export const feedbackSchema = z.object({
  feedback: z.string().trim().min(1).max(2000),
})
