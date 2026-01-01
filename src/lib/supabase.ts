import { createClient } from '@supabase/supabase-js'
import { withRetry, parseError, ErrorCodes } from './errors'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'goals-2026-auth',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// Types
export interface Goal {
  id: string
  user_id: string
  title: string
  description?: string
  status: boolean
  priority: 'high' | 'medium' | 'low'
  position: number
  category: string
  target_date?: string
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
  }
}

// Health check - verify database connection
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const { error } = await supabase.from('goals').select('id').limit(1)
    return !error
  } catch {
    return false
  }
}

// Goal CRUD Operations with retry
export const goalsApi = {
  async getAll(userId: string): Promise<Goal[]> {
    console.log('goalsApi.getAll: Starting with Supabase client...')
    
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('position', { ascending: true })
      
      console.log('goalsApi.getAll: Got response, error:', error, 'data count:', data?.length)
      
      if (error) throw error
      return data || []
    } catch (err) {
      console.error('goalsApi.getAll error:', err)
      throw err
    }
  },

  async create(goal: Omit<Goal, 'id' | 'created_at' | 'updated_at'>): Promise<Goal> {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('goals')
        .insert(goal)
        .select()
        .single()
      
      if (error) throw error
      return data
    })
  },

  async update(id: string, updates: Partial<Goal>): Promise<Goal> {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    })
  },

  async delete(id: string): Promise<void> {
    return withRetry(async () => {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    })
  },

  async updatePositions(goals: { id: string; position: number }[]): Promise<void> {
    return withRetry(async () => {
      const updates = goals.map(({ id, position }) =>
        supabase.from('goals').update({ position }).eq('id', id)
      )
      const results = await Promise.all(updates)
      const error = results.find(r => r.error)?.error
      if (error) throw error
    })
  }
}

// Auth Operations
export const authApi = {
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) throw error
    return data
  },

  async signInWithFacebook() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) throw error
    return data
  },

  async signInWithDiscord() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) throw error
    return data
  },

  async signInWithUsername(username: string, password: string) {
    // ใช้ username เป็น fake email format
    const fakeEmail = `${username.toLowerCase().replace(/\s+/g, '')}@local.app`
    const { data, error } = await supabase.auth.signInWithPassword({
      email: fakeEmail,
      password
    })
    if (error) throw error
    return data
  },

  async signUpWithUsername(username: string, password: string) {
    const fakeEmail = `${username.toLowerCase().replace(/\s+/g, '')}@local.app`
    const { data, error } = await supabase.auth.signUp({
      email: fakeEmail,
      password,
      options: {
        data: {
          full_name: username
        }
      }
    })
    if (error) throw error
    return data
  },

  async signOut(forceReload: boolean = false) {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut()
      
      // Clear all localStorage items related to auth
      if (typeof window !== 'undefined') {
        // Clear Supabase auth tokens
        const keysToRemove: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.includes('supabase') || key.includes('sb-') || key.includes('goals-2026-auth'))) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key))
        
        // Clear sessionStorage too
        sessionStorage.clear()
      }
      
      // Only force reload if explicitly requested AND not on Safari iOS
      // Safari iOS handles state changes better without reload
      if (forceReload && typeof window !== 'undefined') {
        const isSafariIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
                           /Safari/.test(navigator.userAgent) && 
                           !/Chrome|CriOS|FxiOS/.test(navigator.userAgent)
        if (!isSafariIOS) {
          window.location.href = window.location.origin
        }
      }
    } catch (err) {
      // Even if error, still clear local storage
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }
      console.log('Sign out completed with cleanup')
    }
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session
  },

  async refreshSession() {
    const { data, error } = await supabase.auth.refreshSession()
    if (error) throw error
    return data.session
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  },

  // Check if session is valid and refresh if needed
  async ensureValidSession() {
    try {
      const session = await this.getSession()
      if (!session) return null
      
      // Check if token is about to expire (within 5 minutes)
      const expiresAt = session.expires_at
      if (expiresAt) {
        const now = Math.floor(Date.now() / 1000)
        const fiveMinutes = 5 * 60
        if (expiresAt - now < fiveMinutes) {
          return await this.refreshSession()
        }
      }
      
      return session
    } catch (error) {
      const appError = parseError(error)
      if (appError.code === ErrorCodes.SESSION_EXPIRED) {
        return null
      }
      throw appError
    }
  }
}
