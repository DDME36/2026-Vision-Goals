'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Particle {
  id: number
  x: number
  rotation: number
  size: number
  shade: string
  delay: number
  duration: number
}

interface ConfettiEffectProps {
  trigger: boolean
  onComplete?: () => void
}

export function ConfettiEffect({ trigger, onComplete }: ConfettiEffectProps) {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    if (trigger) {
      const shades = ['#1a1a1a', '#333', '#4a4a4a', '#666', '#888']
      
      const newParticles: Particle[] = Array.from({ length: 24 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 280,
        rotation: Math.random() * 360,
        size: Math.random() * 5 + 3,
        shade: shades[Math.floor(Math.random() * shades.length)],
        delay: Math.random() * 0.15,
        duration: 0.8 + Math.random() * 0.3,
      }))
      setParticles(newParticles)

      const timer = setTimeout(() => {
        setParticles([])
        onComplete?.()
      }, 1300)

      return () => clearTimeout(timer)
    }
  }, [trigger, onComplete])

  return (
    <AnimatePresence>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{
            opacity: 1,
            x: particle.x * 0.3,
            y: -10,
            rotate: 0,
            scale: 0.5,
          }}
          animate={{
            opacity: [1, 1, 0],
            x: particle.x,
            y: 120,
            rotate: particle.rotation,
            scale: [0.5, 1, 0.6],
          }}
          transition={{
            duration: particle.duration,
            ease: 'linear',
            delay: particle.delay,
          }}
          className="absolute pointer-events-none rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.shade,
            left: '50%',
            top: 0,
          }}
        />
      ))}
    </AnimatePresence>
  )
}
