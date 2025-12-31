'use client'

import { useState, useRef, useEffect } from 'react'
import { Share2, Download, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Goal } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface SharePosterProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  goals: Goal[]
  userName: string
  userAvatar?: string
}

const posterThemes = [
  { 
    id: 'minimal', 
    name: 'มินิมอล', 
    bgGradient: ['#f5f5f4', '#e7e5e4'],
    textColor: '#292524',
    accentColor: '#57534e',
    cardBg: 'rgba(0,0,0,0.05)',
  },
  { 
    id: 'dark', 
    name: 'มืดเท่', 
    bgGradient: ['#27272a', '#000000'],
    textColor: '#ffffff',
    accentColor: '#a1a1aa',
    cardBg: 'rgba(255,255,255,0.1)',
  },
  { 
    id: 'sunset', 
    name: 'พระอาทิตย์ตก', 
    bgGradient: ['#fed7aa', '#fecdd3', '#d8b4fe'],
    textColor: '#881337',
    accentColor: '#be123c',
    cardBg: 'rgba(0,0,0,0.05)',
  },
  { 
    id: 'ocean', 
    name: 'มหาสมุทร', 
    bgGradient: ['#22d3ee', '#3b82f6', '#4f46e5'],
    textColor: '#ffffff',
    accentColor: '#cffafe',
    cardBg: 'rgba(255,255,255,0.15)',
  },
]

export function SharePoster({ open, onOpenChange, goals, userName, userAvatar }: SharePosterProps) {
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [selectedTheme, setSelectedTheme] = useState(posterThemes[0])
  const [isGenerating, setIsGenerating] = useState(false)
  const desktopCanvasRef = useRef<HTMLCanvasElement>(null)
  const mobileCanvasRef = useRef<HTMLCanvasElement>(null)

  // Reset selected goals when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedGoals([])
    }
  }, [open])

  const toggleGoal = (id: string) => {
    setSelectedGoals(prev => 
      prev.includes(id) 
        ? prev.filter(g => g !== id)
        : prev.length < 6 ? [...prev, id] : prev
    )
  }

  const drawPoster = async (canvas: HTMLCanvasElement, scale: number = 1, goalsToRender: Goal[]) => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const completedGoalsCount = goalsToRender.filter(g => g.status).length

    const w = 1080 * scale
    const h = 1920 * scale
    canvas.width = w
    canvas.height = h

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, w, h)
    selectedTheme.bgGradient.forEach((color, i) => {
      gradient.addColorStop(i / (selectedTheme.bgGradient.length - 1), color)
    })
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, w, h)

    const s = scale // shorthand for scale

    // Helper function for rounded rect
    const roundRect = (x: number, y: number, width: number, height: number, radius: number) => {
      ctx.beginPath()
      ctx.moveTo(x + radius, y)
      ctx.lineTo(x + width - radius, y)
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
      ctx.lineTo(x + width, y + height - radius)
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
      ctx.lineTo(x + radius, y + height)
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
      ctx.lineTo(x, y + radius)
      ctx.quadraticCurveTo(x, y, x + radius, y)
      ctx.closePath()
    }

    // Title icon (target circle)
    ctx.fillStyle = selectedTheme.textColor
    ctx.strokeStyle = selectedTheme.textColor
    ctx.lineWidth = 3 * s
    ctx.beginPath()
    ctx.arc(w/2, 100*s, 30*s, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(w/2, 100*s, 18*s, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(w/2, 100*s, 6*s, 0, Math.PI * 2)
    ctx.fill()

    // Title
    ctx.fillStyle = selectedTheme.textColor
    ctx.font = `bold ${64*s}px "Sriracha", "IBM Plex Sans Thai", sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText('เป้าหมายปี 2026', w/2, 200*s)

    // Subtitle
    ctx.fillStyle = selectedTheme.accentColor
    ctx.font = `${28*s}px "IBM Plex Sans Thai", sans-serif`
    ctx.fillText('My Vision Board', w/2, 250*s)

    // User avatar + username (ชื่ออยู่ตรงกลาง, avatar อยู่ข้างหน้า)
    const avatarY = 320 * s
    const avatarSize = 80 * s
    const avatarGap = 16 * s
    
    // วัดความกว้างของชื่อ
    ctx.font = `500 ${32*s}px "IBM Plex Sans Thai", sans-serif`
    const nameWidth = ctx.measureText(userName).width
    
    // ชื่ออยู่ตรงกลาง
    const nameX = w / 2
    // Avatar อยู่ข้างหน้าชื่อ
    const avatarCenterX = nameX - (nameWidth / 2) - avatarGap - (avatarSize / 2)
    
    // Helper function to draw initials fallback
    const drawInitialsFallback = () => {
      ctx.fillStyle = selectedTheme.cardBg
      ctx.beginPath()
      ctx.arc(avatarCenterX, avatarY, avatarSize/2, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = selectedTheme.textColor
      ctx.font = `bold ${36*s}px "IBM Plex Sans Thai", sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(userName.charAt(0).toUpperCase(), avatarCenterX, avatarY + 12*s)
    }

    if (userAvatar) {
      // Check if it's a base64 image (no CORS issues)
      const isBase64 = userAvatar.startsWith('data:')
      
      try {
        const img = new Image()
        if (!isBase64) {
          img.crossOrigin = 'anonymous'
        }
        
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
          // For external URLs (Google/Facebook), try using a CORS proxy
          if (!isBase64 && (userAvatar.includes('googleusercontent.com') || userAvatar.includes('facebook.com') || userAvatar.includes('fbcdn.net'))) {
            // Use allorigins proxy for CORS
            img.src = `https://api.allorigins.win/raw?url=${encodeURIComponent(userAvatar)}`
          } else {
            img.src = userAvatar
          }
        })
        
        // Draw circular avatar
        ctx.save()
        ctx.beginPath()
        ctx.arc(avatarCenterX, avatarY, avatarSize/2, 0, Math.PI * 2)
        ctx.closePath()
        ctx.clip()
        ctx.drawImage(img, avatarCenterX - avatarSize/2, avatarY - avatarSize/2, avatarSize, avatarSize)
        ctx.restore()
        
        // Border
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'
        ctx.lineWidth = 3 * s
        ctx.beginPath()
        ctx.arc(avatarCenterX, avatarY, avatarSize/2, 0, Math.PI * 2)
        ctx.stroke()
      } catch (e) {
        // Draw initial if avatar fails
        drawInitialsFallback()
      }
    } else {
      // Draw initial
      drawInitialsFallback()
    }

    // Username (ตรงกลาง)
    ctx.fillStyle = selectedTheme.textColor
    ctx.font = `500 ${32*s}px "IBM Plex Sans Thai", sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(userName, nameX, avatarY + 10*s)

    // Goals
    const startY = 440 * s
    const cardHeight = 100 * s
    const cardGap = 20 * s
    const cardPadding = 64 * s

    ctx.textAlign = 'left'
    goalsToRender.forEach((goal, index) => {
      const y = startY + index * (cardHeight + cardGap)
      
      // Card background
      ctx.fillStyle = selectedTheme.cardBg
      roundRect(cardPadding, y, w - cardPadding*2, cardHeight, 24*s)
      ctx.fill()

      // Number circle
      const circleX = cardPadding + 50*s
      const circleY = y + cardHeight/2
      const circleR = 28*s
      
      if (goal.status) {
        ctx.fillStyle = '#22c55e'
      } else {
        ctx.fillStyle = selectedTheme.cardBg
      }
      ctx.beginPath()
      ctx.arc(circleX, circleY, circleR, 0, Math.PI * 2)
      ctx.fill()

      // Number or checkmark
      ctx.fillStyle = goal.status ? '#ffffff' : selectedTheme.textColor
      ctx.font = `bold ${24*s}px "IBM Plex Sans Thai", sans-serif`
      ctx.textAlign = 'center'
      if (goal.status) {
        ctx.fillText('✓', circleX, circleY + 8*s)
      } else {
        ctx.fillText(String(index + 1), circleX, circleY + 8*s)
      }

      // Goal title
      ctx.textAlign = 'left'
      ctx.fillStyle = selectedTheme.textColor
      ctx.globalAlpha = goal.status ? 0.6 : 1
      ctx.font = `${32*s}px "Sriracha", "IBM Plex Sans Thai", sans-serif`
      
      const titleX = cardPadding + 100*s
      const maxWidth = w - cardPadding*2 - 120*s
      let title = goal.title
      
      // Truncate if too long
      while (ctx.measureText(title).width > maxWidth && title.length > 0) {
        title = title.slice(0, -1)
      }
      if (title !== goal.title) title += '...'
      
      if (goal.status) {
        ctx.fillText(title, titleX, circleY + 10*s)
        // Strikethrough
        const textWidth = ctx.measureText(title).width
        ctx.strokeStyle = selectedTheme.textColor
        ctx.lineWidth = 2*s
        ctx.beginPath()
        ctx.moveTo(titleX, circleY + 2*s)
        ctx.lineTo(titleX + textWidth, circleY + 2*s)
        ctx.stroke()
      } else {
        ctx.fillText(title, titleX, circleY + 10*s)
      }
      ctx.globalAlpha = 1
    })

    // Footer - only show if there are goals
    if (goalsToRender.length > 0) {
      const footerY = h - 200*s

      // Progress badge
      ctx.fillStyle = selectedTheme.cardBg
      const badgeText = `✨ ${completedGoalsCount}/${goalsToRender.length} สำเร็จแล้ว`
      ctx.font = `${26*s}px "IBM Plex Sans Thai", sans-serif`
      const badgeWidth = ctx.measureText(badgeText).width + 60*s
      roundRect(w/2 - badgeWidth/2, footerY, badgeWidth, 50*s, 25*s)
      ctx.fill()

      ctx.fillStyle = selectedTheme.textColor
      ctx.textAlign = 'center'
      ctx.fillText(badgeText, w/2, footerY + 34*s)

      // Credit
      ctx.fillStyle = selectedTheme.accentColor
      ctx.font = `${22*s}px "IBM Plex Sans Thai", sans-serif`
      ctx.fillText('2026 Vision Board • Made by Dome', w/2, footerY + 100*s)
    } else {
      // Show placeholder text when no goals selected
      ctx.fillStyle = selectedTheme.accentColor
      ctx.font = `${28*s}px "IBM Plex Sans Thai", sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText('เลือกเป้าหมายเพื่อดูตัวอย่าง', w/2, 500*s)
      
      // Credit at bottom
      ctx.fillStyle = selectedTheme.accentColor
      ctx.font = `${22*s}px "IBM Plex Sans Thai", sans-serif`
      ctx.fillText('2026 Vision Board • Made by Dome', w/2, h - 100*s)
    }
  }

  // Update preview when theme or goals change
  useEffect(() => {
    if (!open) return
    
    const goalsToRender = goals.filter(g => selectedGoals.includes(g.id))
    
    // Draw on both canvases
    const drawBoth = () => {
      if (desktopCanvasRef.current) {
        drawPoster(desktopCanvasRef.current, 0.4, goalsToRender)
      }
      if (mobileCanvasRef.current) {
        drawPoster(mobileCanvasRef.current, 0.3, goalsToRender)
      }
    }
    
    // Small delay to ensure canvas is mounted
    requestAnimationFrame(drawBoth)
  }, [selectedTheme, selectedGoals, open, userName, userAvatar, goals])

  const downloadPoster = async () => {
    setIsGenerating(true)
    
    try {
      const canvas = document.createElement('canvas')
      const goalsToRender = goals.filter(g => selectedGoals.includes(g.id))
      await drawPoster(canvas, 1, goalsToRender)
      
      const dataUrl = canvas.toDataURL('image/png', 1)
      const link = document.createElement('a')
      link.download = `2026-goals-${userName}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Error generating poster:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto max-sm:pt-12">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
            สร้าง Poster แชร์เป้าหมาย
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mt-3 sm:mt-4">
          {/* Left: Options */}
          <div className="space-y-4 sm:space-y-6">
            {/* Theme Selection */}
            <div>
              <label className="text-sm font-medium mb-2 sm:mb-3 block">เลือกธีม</label>
              <div className="grid grid-cols-4 sm:grid-cols-2 gap-1.5 sm:gap-2">
                {posterThemes.map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme)}
                    className={cn(
                      'p-2 sm:p-3 rounded-xl border-2 transition-all text-left',
                      selectedTheme.id === theme.id 
                        ? 'border-primary ring-2 ring-primary/20' 
                        : 'border-border'
                    )}
                  >
                    <div 
                      className="w-full h-6 sm:h-8 rounded-lg mb-1 sm:mb-2" 
                      style={{ 
                        background: `linear-gradient(135deg, ${theme.bgGradient.join(', ')})` 
                      }}
                    />
                    <span className="text-[10px] sm:text-sm block truncate">{theme.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Goal Selection */}
            <div>
              <label className="text-sm font-medium mb-2 sm:mb-3 block">
                เลือกเป้าหมาย (สูงสุด 6 รายการ)
              </label>
              <div className="space-y-1.5 sm:space-y-2 max-h-[200px] sm:max-h-[300px] overflow-y-auto pr-1 sm:pr-2">
                {goals.map(goal => (
                  <button
                    key={goal.id}
                    onClick={() => toggleGoal(goal.id)}
                    className={cn(
                      'w-full p-2.5 sm:p-3 rounded-xl border text-left transition-all flex items-center gap-2 sm:gap-3',
                      selectedGoals.includes(goal.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    )}
                  >
                    <div className={cn(
                      'w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                      selectedGoals.includes(goal.id) 
                        ? 'border-primary bg-primary' 
                        : 'border-muted-foreground'
                    )}>
                      {selectedGoals.includes(goal.id) && (
                        <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm sm:text-base font-medium truncate',
                        goal.status && 'line-through text-muted-foreground'
                      )}>
                        {goal.title}
                      </p>
                    </div>
                    {goal.status && (
                      <span className="text-[10px] sm:text-xs text-green-600 bg-green-50 px-1.5 sm:px-2 py-0.5 rounded-full flex-shrink-0">
                        สำเร็จ
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Download Button */}
            <Button 
              onClick={downloadPoster} 
              disabled={isGenerating || selectedGoals.length === 0}
              className="w-full h-10 sm:h-12 gap-2"
            >
              {isGenerating ? (
                <>กำลังสร้าง...</>
              ) : (
                <>
                  <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                  ดาวน์โหลด Poster
                </>
              )}
            </Button>

            <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
              ขนาด 1080x1920 px เหมาะสำหรับ IG/FB Story
            </p>

            {/* Mobile Preview - Small */}
            <div className="md:hidden flex justify-center">
              <div className="w-[140px] aspect-[9/16] rounded-xl overflow-hidden shadow-lg bg-muted">
                <canvas 
                  ref={mobileCanvasRef}
                  width={324}
                  height={576}
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>

          {/* Right: Preview - Desktop only */}
          <div className="hidden md:flex flex-col items-center">
            <label className="text-sm font-medium mb-3 block self-start">ตัวอย่าง</label>
            <div className="w-full max-w-[320px] aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl bg-muted">
              <canvas 
                ref={desktopCanvasRef}
                width={432}
                height={768}
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
