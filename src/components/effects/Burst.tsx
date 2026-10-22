'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const COLORS = ['#f97316', '#22c55e', '#eab308', '#0ea5e9', '#ec4899']

interface Particle {
  id: string
  x: number
  y: number
  size: number
  color: string
}

/** Small confetti pop from the card's checkbox. Re-fires whenever `trigger` increments. */
export function Burst({ trigger }: { trigger: number }) {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    if (!trigger) return
    setParticles(
      Array.from({ length: 16 }, (_, i) => {
        const angle = (i / 16) * Math.PI * 2 + Math.random() * 0.4
        const dist = 40 + Math.random() * 50
        return {
          id: `${trigger}-${i}`,
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist,
          size: 4 + Math.random() * 4,
          color: COLORS[i % COLORS.length],
        }
      }),
    )
    const timer = setTimeout(() => setParticles([]), 800)
    return () => clearTimeout(timer)
  }, [trigger])

  return (
    <div className="pointer-events-none absolute left-8 top-8 z-10" aria-hidden>
      <AnimatePresence>
        {particles.map((p) => (
          <motion.span
            key={p.id}
            className="absolute rounded-full"
            style={{ width: p.size, height: p.size, backgroundColor: p.color }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
