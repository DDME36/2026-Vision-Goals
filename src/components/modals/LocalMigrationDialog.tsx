'use client'

import { useEffect, useState } from 'react'
import { CloudUpload } from 'lucide-react'
import { toast } from 'sonner'
import { errorMessage } from '@/lib/api-client'
import { clearLocalGoals, loadAllLocalGoals } from '@/lib/repositories/local'
import { remoteRepository } from '@/lib/repositories/remote'
import type { Goal } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const DISMISS_KEY = 'vg-local-migration-dismissed'

/** After signing in, offers to move goals created in guest mode into the account. */
export function LocalMigrationDialog({ onMigrated }: { onMigrated: () => void }) {
  const [localGoals, setLocalGoals] = useState<Goal[]>([])
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const goals = loadAllLocalGoals()
    let dismissed = false
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === String(goals.length)
    } catch {
      /* ignore */
    }
    if (goals.length && !dismissed) {
      setLocalGoals(goals)
      setOpen(true)
    }
  }, [])

  const migrate = async () => {
    setBusy(true)
    try {
      const result = await remoteRepository.importGoals(localGoals)
      clearLocalGoals()
      toast.success(`ย้าย ${result.added} เป้าหมายขึ้นบัญชีแล้ว`)
      setOpen(false)
      onMigrated()
    } catch (err) {
      toast.error(errorMessage(err, 'ย้ายข้อมูลไม่สำเร็จ'))
    } finally {
      setBusy(false)
    }
  }

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(localGoals.length))
    } catch {
      /* ignore */
    }
    setOpen(false)
  }

  const years = [...new Set(localGoals.map((g) => g.year))].sort().join(', ')

  return (
    <Dialog open={open} onOpenChange={(o) => !o && dismiss()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader icon={<CloudUpload />}>
          <DialogTitle>พบเป้าหมายในเครื่องนี้</DialogTitle>
          <DialogDescription>
            มี {localGoals.length} เป้าหมาย (ปี {years}) ที่สร้างไว้ตอนใช้แบบไม่ล็อกอิน ย้ายขึ้นบัญชีเพื่อใช้ได้ทุกอุปกรณ์ไหม?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={dismiss}>
            ไว้ทีหลัง
          </Button>
          <Button variant="brand" onClick={migrate} loading={busy}>
            ย้ายขึ้นบัญชี
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
