'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Wifi, WifiOff } from 'lucide-react'

export function NetworkStatus() {
  const [online, setOnline] = useState(true)
  const [recovered, setRecovered] = useState(false)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const update = (next: boolean) => {
      setOnline((prev) => {
        if (next && !prev) {
          setRecovered(true)
          clearTimeout(timer)
          timer = setTimeout(() => setRecovered(false), 2500)
        }
        return next
      })
    }
    update(navigator.onLine)
    const on = () => update(true)
    const off = () => update(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  const show = !online || recovered
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="status"
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="fixed inset-x-0 top-[max(env(safe-area-inset-top),0.75rem)] z-60 flex justify-center px-4"
        >
          <div
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white shadow-lg ${
              online ? 'bg-success' : 'bg-foreground/90 dark:bg-card dark:text-foreground'
            }`}
          >
            {online ? <Wifi className="size-4" /> : <WifiOff className="size-4" />}
            {online ? 'กลับมาออนไลน์แล้ว' : 'ออฟไลน์อยู่ — การเปลี่ยนแปลงอาจไม่ถูกบันทึก'}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
