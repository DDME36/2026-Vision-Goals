'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { CheckCircle2, MessageSquareHeart, Send } from 'lucide-react'
import { toast } from 'sonner'
import { api, errorMessage } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/input'

export function FeedbackModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api('/api/feedback', { method: 'POST', json: { feedback } })
      setSent(true)
      setFeedback('')
      setTimeout(() => {
        onOpenChange(false)
        setSent(false)
      }, 1800)
    } catch (err) {
      toast.error(errorMessage(err, 'ส่งไม่สำเร็จ กรุณาลองใหม่'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {sent ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-10 text-center">
            <CheckCircle2 className="mx-auto mb-3 size-12 text-success" />
            <DialogTitle>ขอบคุณสำหรับข้อเสนอแนะ!</DialogTitle>
            <DialogDescription className="mt-1">ทีม Zentyr จะนำไปพัฒนาให้ดียิ่งขึ้น</DialogDescription>
          </motion.div>
        ) : (
          <>
            <DialogHeader icon={<MessageSquareHeart />}>
              <DialogTitle>ส่งข้อเสนอแนะ</DialogTitle>
              <DialogDescription>ไม่ระบุตัวตน บอกได้ทั้งปัญหาที่เจอ หรือฟีเจอร์ที่อยากได้</DialogDescription>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4">
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value.slice(0, 2000))}
                placeholder="เขียนถึงเราได้เลย…"
                className="min-h-[140px]"
                autoFocus
              />
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                  ยกเลิก
                </Button>
                <Button type="submit" variant="brand" loading={loading} disabled={!feedback.trim()}>
                  <Send />
                  ส่ง
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
