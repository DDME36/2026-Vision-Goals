'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Send, Loader2, CheckCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface FeedbackModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1456187506960633856/FH1QsdGVNMgQaUQyqVlicvjhbcwPNoFRPdUOxbh-sUI4KrjgcOaCutbHbO6N-aia7fOA'

export function FeedbackModal({ open, onOpenChange }: FeedbackModalProps) {
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!feedback.trim()) return

    setLoading(true)
    try {
      await fetch(DISCORD_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: '💬 Feedback ใหม่',
            description: feedback,
            color: 0x5865F2,
            timestamp: new Date().toISOString(),
            footer: { text: '2026 Vision Board - Anonymous Feedback' }
          }]
        })
      })
      setSent(true)
      setFeedback('')
      setTimeout(() => {
        onOpenChange(false)
        setSent(false)
      }, 2000)
    } catch (err) {
      console.error('Failed to send feedback:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            ส่ง Feedback
          </DialogTitle>
        </DialogHeader>

        {sent ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-8 text-center"
          >
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-lg font-medium">ขอบคุณสำหรับ Feedback!</p>
            <p className="text-sm text-muted-foreground mt-1">เราจะนำไปปรับปรุงต่อไป</p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-muted/50 rounded-xl p-3 text-sm text-muted-foreground">
              <p>Feedback นี้ไม่เปิดเผยชื่อผู้ส่ง สามารถบอกข้อเสนอแนะ การปรับปรุง หรือเสนอไอเดียใหม่ๆ มาได้เลย</p>
            </div>

            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="เขียน feedback ของคุณที่นี่..."
              className="flex min-h-[120px] w-full rounded-xl border border-border bg-background px-3 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset resize-none"
              required
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                ยกเลิก
              </Button>
              <Button type="submit" disabled={loading || !feedback.trim()}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    ส่ง Feedback
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
