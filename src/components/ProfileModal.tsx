'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { User, Camera, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ImageCropper } from '@/components/ImageCropper'
import { supabase } from '@/lib/supabase'

interface ProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentName: string
  currentAvatar?: string
  onUpdate: () => void
}

export function ProfileModal({ 
  open, 
  onOpenChange, 
  currentName, 
  currentAvatar,
  onUpdate 
}: ProfileModalProps) {
  const [displayName, setDisplayName] = useState(currentName)
  const [avatarUrl, setAvatarUrl] = useState(currentAvatar || '')
  const [avatarPreview, setAvatarPreview] = useState(currentAvatar || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Cropper state
  const [cropperOpen, setCropperOpen] = useState(false)
  const [rawImage, setRawImage] = useState('')

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('กรุณาเลือกไฟล์รูปภาพ')
      return
    }

    // Allow larger files since we'll crop and compress
    if (file.size > 5 * 1024 * 1024) {
      setError('ไฟล์ต้องมีขนาดไม่เกิน 5MB')
      return
    }

    setError('')

    // Read file and open cropper
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      setRawImage(base64)
      setCropperOpen(true)
    }
    reader.onerror = () => {
      setError('อ่านไฟล์ไม่สำเร็จ')
    }
    reader.readAsDataURL(file)
    
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleCropComplete = (croppedImage: string) => {
    setAvatarPreview(croppedImage)
    setAvatarUrl(croppedImage)
  }

  const handleSave = async () => {
    if (!displayName.trim()) {
      setError('กรุณากรอกชื่อที่แสดง')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: displayName.trim(),
          avatar_url: avatarUrl || undefined,
        }
      })

      if (error) throw error

      onUpdate()
      onOpenChange(false)
    } catch (err: unknown) {
      console.error('Update error:', err)
      setError('บันทึกไม่สำเร็จ กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <User className="w-5 h-5" />
              แก้ไขโปรไฟล์
            </DialogTitle>
            <DialogDescription>
              เปลี่ยนชื่อและรูปโปรไฟล์ของคุณ
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Avatar */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-muted border-4 border-background shadow-lg">
                  {avatarPreview ? (
                    <img 
                      src={avatarPreview} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-3xl font-bold">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                </button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                คลิกที่กล้องเพื่อเปลี่ยนรูป
              </p>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium">ชื่อที่แสดง</label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="ชื่อของคุณ"
                className="h-11"
              />
            </div>

            {/* Error */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-500 text-center"
              >
                {error}
              </motion.p>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                ยกเลิก
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  'บันทึก'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Cropper Modal */}
      <ImageCropper
        open={cropperOpen}
        onOpenChange={setCropperOpen}
        imageSrc={rawImage}
        onCropComplete={handleCropComplete}
      />
    </>
  )
}
