'use client'

import { Keyboard } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const shortcuts = [
  { keys: ['N'], label: 'เพิ่มเป้าหมายใหม่' },
  { keys: ['/'], label: 'ค้นหา' },
  { keys: ['['], label: 'ไปปีก่อนหน้า' },
  { keys: [']'], label: 'ไปปีถัดไป' },
  { keys: ['?'], label: 'แสดงคีย์ลัด' },
  { keys: ['Esc'], label: 'ปิดหน้าต่าง / ล้างคำค้นหา' },
  { keys: ['ดับเบิลคลิก'], label: 'แก้ไขเป้าหมาย' },
]

export function ShortcutsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader icon={<Keyboard />}>
          <DialogTitle>คีย์ลัด</DialogTitle>
          <DialogDescription>ทำงานได้เร็วขึ้นด้วยคีย์บอร์ด</DialogDescription>
        </DialogHeader>
        <ul className="divide-y">
          {shortcuts.map((s) => (
            <li key={s.label} className="flex items-center justify-between py-2.5 text-sm">
              <span>{s.label}</span>
              <span className="flex gap-1">
                {s.keys.map((k) => (
                  <kbd key={k} className="kbd h-6 px-2 text-xs">
                    {k}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
