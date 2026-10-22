'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, KeyRound, Trash2, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { api, errorMessage } from '@/lib/api-client'
import { LIMITS } from '@/lib/config'
import type { AppUser } from '@/lib/types'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input, Label } from '@/components/ui/input'
import { ImageCropper } from './ImageCropper'

interface ProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: AppUser
  onUpdated: (user: AppUser) => void
}

export function ProfileModal({ open, onOpenChange, user, onUpdated }: ProfileModalProps) {
  const [displayName, setDisplayName] = useState(user.displayName)
  const [avatar, setAvatar] = useState<string | null>(user.avatarUrl)
  const [saving, setSaving] = useState(false)
  const [rawImage, setRawImage] = useState('')
  const [cropperOpen, setCropperOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setDisplayName(user.displayName)
    setAvatar(user.avatarUrl)
    setCurrentPassword('')
    setNewPassword('')
  }, [open, user])

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) return toast.error('กรุณาเลือกไฟล์รูปภาพ')
    if (file.size > 10 * 1024 * 1024) return toast.error('ไฟล์ต้องไม่เกิน 10MB')
    const reader = new FileReader()
    reader.onload = () => {
      setRawImage(String(reader.result))
      setCropperOpen(true)
    }
    reader.readAsDataURL(file)
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      const { user: updated } = await api<{ user: AppUser }>('/api/profile', {
        method: 'PATCH',
        json: { displayName, avatarUrl: avatar },
      })
      onUpdated(updated)
      toast.success('บันทึกโปรไฟล์แล้ว')
      onOpenChange(false)
    } catch (err) {
      toast.error(errorMessage(err, 'บันทึกไม่สำเร็จ'))
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setChangingPassword(true)
    try {
      await api('/api/profile/password', { method: 'POST', json: { currentPassword, newPassword } })
      toast.success('เปลี่ยนรหัสผ่านแล้ว', { description: 'อุปกรณ์อื่นถูกออกจากระบบเพื่อความปลอดภัย' })
      setCurrentPassword('')
      setNewPassword('')
    } catch (err) {
      toast.error(errorMessage(err, 'เปลี่ยนรหัสผ่านไม่สำเร็จ'))
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader icon={<UserRound />}>
            <DialogTitle>โปรไฟล์</DialogTitle>
            <DialogDescription>@{user.username}</DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar name={displayName || user.username} src={avatar} className="size-20 text-2xl ring-4" />
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-transform hover:scale-105"
                aria-label="เปลี่ยนรูปโปรไฟล์"
              >
                <Camera className="size-4" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickFile} />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="display-name">ชื่อที่แสดง</Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value.slice(0, LIMITS.displayName))}
                placeholder="ชื่อของคุณ"
              />
              {avatar && (
                <button onClick={() => setAvatar(null)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-danger">
                  <Trash2 className="size-3" />
                  ลบรูปโปรไฟล์
                </button>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              ยกเลิก
            </Button>
            <Button variant="brand" onClick={saveProfile} loading={saving} disabled={!displayName.trim()}>
              บันทึกโปรไฟล์
            </Button>
          </DialogFooter>

          <form onSubmit={changePassword} className="space-y-3 border-t pt-5">
            <p className="flex items-center gap-2 text-sm font-medium">
              <KeyRound className="size-4 text-muted-foreground" />
              เปลี่ยนรหัสผ่าน
            </p>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="รหัสผ่านปัจจุบัน"
              autoComplete="current-password"
            />
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={`รหัสผ่านใหม่ (อย่างน้อย ${LIMITS.password.min} ตัว)`}
              autoComplete="new-password"
            />
            <Button
              type="submit"
              variant="outline"
              className="w-full"
              loading={changingPassword}
              disabled={!currentPassword || newPassword.length < LIMITS.password.min}
            >
              อัปเดตรหัสผ่าน
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <ImageCropper open={cropperOpen} onOpenChange={setCropperOpen} imageSrc={rawImage} onCropComplete={setAvatar} />
    </>
  )
}
