'use client'

import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/api-client'
import { guestMode } from '@/lib/repositories/local'
import type { AppUser } from '@/lib/types'
import { AuthScreen } from '@/components/auth/AuthScreen'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton'

export interface Features {
  feedback: boolean
  registration: boolean
}

export const GUEST_USER: AppUser = {
  id: 'guest',
  username: 'guest',
  displayName: 'ผู้เยี่ยมชม',
  avatarUrl: null,
  isGuest: true,
}

type View = { kind: 'booting' } | { kind: 'auth' } | { kind: 'app'; user: AppUser }

export function App({ initialUser, features }: { initialUser: AppUser | null; features: Features }) {
  const [view, setView] = useState<View>(initialUser ? { kind: 'app', user: initialUser } : { kind: 'booting' })

  // Guest mode lives in localStorage, so it can only be detected after mount.
  useEffect(() => {
    if (initialUser) {
      guestMode.set(false)
      return
    }
    setView(guestMode.isOn() ? { kind: 'app', user: GUEST_USER } : { kind: 'auth' })
  }, [initialUser])

  const handleAuthenticated = useCallback((user: AppUser) => {
    guestMode.set(false)
    setView({ kind: 'app', user })
  }, [])

  const handleGuest = useCallback(() => {
    guestMode.set(true)
    setView({ kind: 'app', user: GUEST_USER })
  }, [])

  const handleSignOut = useCallback(async (user: AppUser) => {
    if (user.isGuest) guestMode.set(false)
    else await api('/api/auth/logout', { method: 'POST' }).catch(() => {})
    setView({ kind: 'auth' })
  }, [])

  const handleSessionExpired = useCallback(() => setView({ kind: 'auth' }), [])

  const handleUserChange = useCallback((user: AppUser) => setView({ kind: 'app', user }), [])

  if (view.kind === 'booting') return <DashboardSkeleton />
  if (view.kind === 'auth') {
    return <AuthScreen allowRegistration={features.registration} onAuthenticated={handleAuthenticated} onGuest={handleGuest} />
  }
  return (
    <Dashboard
      key={view.user.id}
      user={view.user}
      features={features}
      onSignOut={() => handleSignOut(view.user)}
      onSessionExpired={handleSessionExpired}
      onUserChange={handleUserChange}
    />
  )
}
