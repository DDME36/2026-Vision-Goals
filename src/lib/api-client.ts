// Thin fetch wrapper for our own /api routes.

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
  ) {
    super(message)
  }
}

const NETWORK_MESSAGE = 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ต'

export async function api<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init
  let response: Response
  try {
    response = await fetch(path, {
      ...rest,
      credentials: 'same-origin',
      headers: {
        ...(json !== undefined && { 'Content-Type': 'application/json' }),
        ...headers,
      },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    })
  } catch {
    throw new ApiClientError(NETWORK_MESSAGE, 0, 'NETWORK_ERROR')
  }

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiClientError(data?.error ?? 'เกิดข้อผิดพลาด กรุณาลองใหม่', response.status, data?.code ?? 'ERROR')
  }
  return data as T
}

export function errorMessage(error: unknown, fallback = 'เกิดข้อผิดพลาด กรุณาลองใหม่') {
  return error instanceof Error && error.message ? error.message : fallback
}

export const isUnauthorized = (error: unknown) => error instanceof ApiClientError && error.status === 401
