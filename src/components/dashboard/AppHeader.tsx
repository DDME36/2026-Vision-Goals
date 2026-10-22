'use client'

import { useEffect, useState } from 'react'
import {
  Download,
  Keyboard,
  LogOut,
  MessageSquareHeart,
  Monitor,
  Moon,
  Plus,
  Share2,
  Sun,
  Upload,
  UserRound,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { isSoundMuted, setSoundMuted } from '@/lib/sounds'
import type { AppUser } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/brand/Logo'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface AppHeaderProps {
  user: AppUser
  onNewGoal: () => void
  onShare: () => void
  onProfile: () => void
  onFeedback?: () => void
  onShortcuts: () => void
  onExport: () => void
  onImport: () => void
  onSignOut: () => void
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const dark = mounted && resolvedTheme === 'dark'
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      aria-label={dark ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด'}
    >
      {dark ? <Sun /> : <Moon />}
    </Button>
  )
}

export function AppHeader(props: AppHeaderProps) {
  const { user, onNewGoal, onShare, onProfile, onFeedback, onShortcuts, onExport, onImport, onSignOut } = props
  const { theme, setTheme } = useTheme()
  const [scrolled, setScrolled] = useState(false)
  const [muted, setMuted] = useState(false)

  useEffect(() => setMuted(isSoundMuted()), [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full pt-[env(safe-area-inset-top)] transition-[background-color,border-color,backdrop-filter]',
        scrolled ? 'border-b bg-background/75 backdrop-blur-xl' : 'border-b border-transparent',
      )}
    >
      <div className="container flex h-16 items-center justify-between gap-3">
        <Logo />

        <div className="flex items-center gap-1 sm:gap-1.5">
          <Button variant="brand" size="sm" onClick={onNewGoal} className="hidden md:inline-flex">
            <Plus />
            เป้าหมายใหม่
            <kbd className="ml-1 rounded bg-white/20 px-1.5 text-[10px] font-semibold">N</kbd>
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onShare} aria-label="สร้างโปสเตอร์แชร์">
            <Share2 />
          </Button>
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="ml-1 flex items-center gap-2 rounded-full p-0.5 pr-0.5 transition-colors hover:bg-accent sm:pr-3"
                aria-label="เมนูบัญชี"
              >
                <Avatar name={user.displayName} src={user.avatarUrl} />
                <span className="hidden max-w-40 truncate text-sm font-medium sm:block">{user.displayName}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <div className="flex items-center gap-3 px-2.5 py-2">
                <Avatar name={user.displayName} src={user.avatarUrl} className="size-10 text-sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{user.displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.isGuest ? 'โหมดผู้เยี่ยมชม' : `@${user.username}`}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              {!user.isGuest && (
                <DropdownMenuItem onSelect={onProfile}>
                  <UserRound />
                  โปรไฟล์และความปลอดภัย
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onSelect={onExport}>
                <Download />
                ส่งออกข้อมูล (JSON)
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onImport}>
                <Upload />
                นำเข้าข้อมูล
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>ธีม</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={theme ?? 'system'} onValueChange={setTheme}>
                <DropdownMenuRadioItem value="light">
                  <Sun />
                  สว่าง
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark">
                  <Moon />
                  มืด
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="system">
                  <Monitor />
                  ตามระบบ
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault()
                  setSoundMuted(!muted)
                  setMuted(!muted)
                }}
              >
                {muted ? <VolumeX /> : <Volume2 />}
                เสียงเอฟเฟกต์
                <DropdownMenuShortcut>{muted ? 'ปิด' : 'เปิด'}</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onShortcuts} className="hidden sm:flex">
                <Keyboard />
                คีย์ลัด
                <DropdownMenuShortcut>?</DropdownMenuShortcut>
              </DropdownMenuItem>
              {onFeedback && (
                <DropdownMenuItem onSelect={onFeedback}>
                  <MessageSquareHeart />
                  ส่งข้อเสนอแนะ
                </DropdownMenuItem>
              )}
              <DropdownMenuItem destructive onSelect={onSignOut}>
                <LogOut />
                {user.isGuest ? 'ออกจากโหมดผู้เยี่ยมชม' : 'ออกจากระบบ'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
