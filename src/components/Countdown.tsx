'use client'

import { useState, useEffect } from 'react'

interface CountdownProps {
  year?: number
}

export function Countdown({ year }: CountdownProps) {
  const [mounted, setMounted] = useState(false)
  const [time, setTime] = useState({ days: 365, hours: 0, minutes: 0, seconds: 0 })
  
  const targetYear = year || new Date().getFullYear()

  useEffect(() => {
    setMounted(true)
    
    const calculate = () => {
      const now = new Date()
      const options: Intl.DateTimeFormatOptions = { 
        timeZone: 'Asia/Bangkok',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
      }
      const thaiTimeStr = now.toLocaleString('en-GB', options)
      const [datePart, timePart] = thaiTimeStr.split(', ')
      const [day, month, yr] = datePart.split('/')
      const [hour, minute, second] = timePart.split(':')
      
      const thaiNow = new Date(
        parseInt(yr), parseInt(month) - 1, parseInt(day),
        parseInt(hour), parseInt(minute), parseInt(second)
      )
      
      const startYear = new Date(targetYear, 0, 1, 0, 0, 0)
      const endYear = new Date(targetYear + 1, 0, 1, 0, 0, 0)
      
      if (thaiNow < startYear) {
        const totalDays = Math.ceil((endYear.getTime() - startYear.getTime()) / (1000 * 60 * 60 * 24))
        setTime({ days: totalDays, hours: 0, minutes: 0, seconds: 0 })
        return
      }
      
      if (thaiNow >= endYear) {
        setTime({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }
      
      const diff = endYear.getTime() - thaiNow.getTime()
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      
      setTime({ days, hours, minutes, seconds })
    }

    calculate()
    const interval = setInterval(calculate, 1000)
    return () => clearInterval(interval)
  }, [targetYear])

  // Prevent hydration mismatch - show skeleton until mounted
  if (!mounted) {
    return (
      <div className="text-right">
        <div className="h-7 sm:h-8 lg:h-9 w-32 bg-muted/30 rounded animate-pulse mb-1" />
        <div className="h-5 sm:h-6 w-20 bg-muted/20 rounded animate-pulse ml-auto" />
      </div>
    )
  }

  return (
    <div className="text-right min-w-[120px] sm:min-w-[140px]">
      <h2 className="font-display text-xl sm:text-2xl lg:text-3xl xl:text-4xl text-foreground whitespace-nowrap tabular-nums">
        เหลือ {time.days} วัน
      </h2>
      <p className="text-muted-foreground text-sm sm:text-base lg:text-lg tabular-nums font-mono">
        {String(time.hours).padStart(2, '0')}:{String(time.minutes).padStart(2, '0')}:{String(time.seconds).padStart(2, '0')}
      </p>
    </div>
  )
}
