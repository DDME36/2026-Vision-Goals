'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Target, LogOut, Share2, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { User as SupabaseUser } from '@supabase/supabase-js'

interface HeaderProps {
  user: SupabaseUser | null
  onSignOut: () => void
  onShare?: () => void
  onEditProfile?: () => void
}

export function Header({ user, onSignOut, onShare, onEditProfile }: HeaderProps) {
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  // ใช้ avatar เฉพาะที่เป็น base64 หรือ URL ที่ valid เท่านั้น
  const avatarUrl = user?.user_metadata?.avatar_url
  const hasValidAvatar = avatarUrl && (avatarUrl.startsWith('data:') || avatarUrl.startsWith('https://'))

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-sm"
    >
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
            <Target className="w-4 h-4 text-primary" />
          </div>
          <h1 className="font-display text-lg text-foreground">2026 Vision</h1>
        </div>

        {/* User Menu */}
        {user && (
          <div className="flex items-center gap-2">
            {/* Share Button */}
            {onShare && (
              <Button variant="ghost" size="sm" onClick={onShare} className="gap-1.5 h-8 px-2">
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">แชร์</span>
              </Button>
            )}

            {/* User Avatar & Name - Clickable */}
            <button
              onClick={onEditProfile}
              className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-accent transition-colors"
            >
              {hasValidAvatar ? (
                <img 
                  src={avatarUrl} 
                  alt={displayName}
                  className="w-7 h-7 rounded-full object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="hidden sm:block text-sm text-muted-foreground">{displayName}</span>
            </button>

            {/* Sign Out */}
            <Button variant="ghost" size="sm" onClick={onSignOut} className="gap-1.5 h-8 px-2">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">ออก</span>
            </Button>
          </div>
        )}
      </div>
    </motion.header>
  )
}
