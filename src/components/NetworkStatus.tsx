'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff, Wifi } from 'lucide-react'
import { onNetworkChange, isOnline } from '@/lib/errors'

export function NetworkStatus() {
  const [online, setOnline] = useState(true)
  const [showReconnected, setShowReconnected] = useState(false)

  useEffect(() => {
    // Set initial state
    setOnline(isOnline())

    // Listen for changes
    const unsubscribe = onNetworkChange((isOnline) => {
      if (isOnline && !online) {
        // Just reconnected
        setShowReconnected(true)
        setTimeout(() => setShowReconnected(false), 3000)
      }
      setOnline(isOnline)
    })

    return unsubscribe
  }, [online])

  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white py-2 px-4 text-center text-sm flex items-center justify-center gap-2 safe-area-top"
        >
          <WifiOff className="w-4 h-4" />
          <span>ไม่มีการเชื่อมต่ออินเทอร์เน็ต</span>
        </motion.div>
      )}
      
      {showReconnected && online && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-green-500 text-white py-2 px-4 text-center text-sm flex items-center justify-center gap-2 safe-area-top"
        >
          <Wifi className="w-4 h-4" />
          <span>เชื่อมต่อแล้ว</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
