'use client'

import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'

interface FloatingAddButtonProps {
  onClick: () => void
}

export function FloatingAddButton({ onClick }: FloatingAddButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center md:hidden"
      style={{ 
        bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
        right: '16px',
      }}
      aria-label="เพิ่มเป้าหมายใหม่"
    >
      <Plus className="w-6 h-6" />
    </motion.button>
  )
}
