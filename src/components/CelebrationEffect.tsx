'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, X } from 'lucide-react'
import { playCelebrationSound } from '@/lib/sounds'

interface CelebrationEffectProps {
  show: boolean
  onComplete?: () => void
}

interface Particle {
  id: number
  x: number
  y: number
  size: number
  color: string
  delay: number
  duration: number
}

export function CelebrationEffect({ show, onComplete }: CelebrationEffectProps) {
  const [particles, setParticles] = useState<Particle[]>([])
  const [showMessage, setShowMessage] = useState(false)

  useEffect(() => {
    if (show) {
      // สร้าง particles เต็มจอ - สีสันสดใส
      const colors = [
        '#ef4444', '#f97316', '#f59e0b', '#eab308', // แดง ส้ม เหลือง
        '#84cc16', '#22c55e', '#10b981', '#14b8a6', // เขียว
        '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', // ฟ้า น้ำเงิน
        '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', // ม่วง ชมพู
        '#fcd34d', '#fbbf24', '#fb923c', // ทอง
      ]
      const newParticles: Particle[] = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -10 - Math.random() * 20,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 1,
      }))
      setParticles(newParticles)
      setShowMessage(true)
      playCelebrationSound()

      // ลบ particles หลังจาก animation เสร็จ แต่ไม่ปิด message
      const particleTimer = setTimeout(() => {
        setParticles([])
      }, 4000)

      return () => clearTimeout(particleTimer)
    }
  }, [show])

  const handleClose = useCallback(() => {
    setShowMessage(false)
    // รอให้ animation ปิดเสร็จก่อนค่อย callback
    setTimeout(() => {
      onComplete?.()
    }, 300)
  }, [onComplete])

  // ถ้าไม่มีอะไรแสดง ให้ return null เลย
  const isActive = show || showMessage || particles.length > 0
  
  if (!isActive) return null

  return (
    <div 
      className={`fixed inset-0 z-50 overflow-hidden ${showMessage ? '' : 'pointer-events-none'}`}
      onClick={showMessage ? handleClose : undefined}
    >
      {/* Backdrop */}
      <AnimatePresence>
        {showMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Particles */}
      <div className="pointer-events-none">
        <AnimatePresence>
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{
                opacity: 1,
                x: `${particle.x}vw`,
                y: `${particle.y}vh`,
                rotate: 0,
              }}
              animate={{
                opacity: [1, 1, 0],
                y: '120vh',
                rotate: Math.random() * 360,
              }}
              transition={{
                duration: particle.duration,
                ease: 'linear',
                delay: particle.delay,
              }}
              className="absolute rounded-full"
              style={{
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
              }}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Celebration Message */}
      <AnimatePresence>
        {showMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.5, y: 50 }}
              transition={{ 
                type: 'spring', 
                stiffness: 300, 
                damping: 25,
              }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-card/95 backdrop-blur-md border-2 border-primary/20 rounded-3xl p-8 shadow-2xl text-center pointer-events-auto"
            >
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center"
              >
                <Trophy className="w-10 h-10 text-white" />
              </motion.div>
              
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: 0.2 }}
                className="font-display text-3xl text-foreground mb-2"
              >
                ยินดีด้วย!
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: 0.3 }}
                className="text-muted-foreground text-lg"
              >
                คุณทำเป้าหมายสำเร็จครบทุกข้อแล้ว!
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-4 text-sm text-muted-foreground/60"
              >
                ปี 2026 เป็นปีที่ยอดเยี่ยมของคุณ
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
