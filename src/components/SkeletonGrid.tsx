'use client'

import { motion } from 'framer-motion'

export function SkeletonGrid() {
  return (
    <div className="min-h-screen min-h-[100dvh] paper-texture flex flex-col">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-muted animate-pulse" />
            <div className="w-24 h-5 rounded bg-muted animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-16 h-8 rounded-lg bg-muted animate-pulse" />
            <div className="w-7 h-7 rounded-full bg-muted animate-pulse" />
          </div>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Hero Skeleton */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="w-48 h-8 sm:h-10 rounded bg-muted animate-pulse mb-2" />
              <div className="w-64 h-4 rounded bg-muted animate-pulse" />
            </div>
            <div className="w-32 h-12 rounded bg-muted animate-pulse" />
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-6 sm:mb-8">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-border rounded-xl p-3 sm:p-4"
            >
              <div className="w-20 h-3 rounded bg-muted animate-pulse mb-2" />
              <div className="w-12 h-7 rounded bg-muted animate-pulse" />
            </motion.div>
          ))}
        </div>

        {/* Progress Bar Skeleton */}
        <div className="mb-6 sm:mb-8">
          <div className="h-1.5 sm:h-2 bg-muted rounded-full animate-pulse" />
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className="bg-card border border-border rounded-xl p-3 sm:p-4 min-h-[60px] sm:min-h-[70px]"
            >
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-muted animate-pulse" />
                <div className="flex-1">
                  <div className="w-3/4 h-4 rounded bg-muted animate-pulse mb-1" />
                  <div className="w-1/2 h-3 rounded bg-muted animate-pulse" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  )
}
