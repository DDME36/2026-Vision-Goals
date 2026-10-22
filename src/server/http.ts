import 'server-only'
import { NextResponse } from 'next/server'
import { ZodError, type ZodType, type ZodTypeDef } from 'zod'
import { getCurrentUser } from '@/server/auth/session'
import type { AppUser } from '@/lib/types'

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = 'ERROR',
    public headers?: Record<string, string>,
  ) {
    super(message)
  }
}

export const json = <T>(data: T, init?: ResponseInit) => NextResponse.json(data, init)

export async function readJson<T>(request: Request, schema: ZodType<T, ZodTypeDef, unknown>): Promise<T> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    throw new ApiError(400, 'รูปแบบข้อมูลไม่ถูกต้อง', 'BAD_JSON')
  }
  return schema.parse(body)
}

export async function requireUser(): Promise<AppUser> {
  const user = await getCurrentUser()
  if (!user) throw new ApiError(401, 'กรุณาเข้าสู่ระบบ', 'UNAUTHORIZED')
  return user
}

type RouteContext<P> = { params: Promise<P> }

/** Wraps a route handler with consistent JSON error responses. */
export function route<P = Record<string, never>>(
  handler: (request: Request, context: RouteContext<P>) => Promise<Response>,
) {
  return async (request: Request, context: RouteContext<P>) => {
    try {
      return await handler(request, context)
    } catch (error) {
      if (error instanceof ApiError) {
        return json({ error: error.message, code: error.code }, { status: error.status, headers: error.headers })
      }
      if (error instanceof ZodError) {
        const message = error.issues[0]?.message ?? 'ข้อมูลไม่ถูกต้อง'
        return json({ error: message, code: 'VALIDATION_ERROR', issues: error.issues }, { status: 422 })
      }
      console.error(`[api] ${request.method} ${new URL(request.url).pathname}`, error)
      return json({ error: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์ กรุณาลองใหม่', code: 'INTERNAL' }, { status: 500 })
    }
  }
}
