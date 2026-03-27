'use client'

import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'

interface AddGoalCardProps {
  onClick: () => void
}

export function AddGoalCard({ onClick }: AddGoalCardProps) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className="w-full h-full min-h-[60px] sm:min-h-[70px] border-2 border-dashed border-border rounded-xl flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 transition-colors bg-transparent hover:bg-card/50"
    >
      <Plus className="w-5 h-5" />
      <span className="text-base font-medium">เพิ่มเป้าหมาย</span>
    </motion.button>
  )
}
