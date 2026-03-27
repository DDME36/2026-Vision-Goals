import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { feedback } = await request.json()

    if (!feedback || typeof feedback !== 'string' || !feedback.trim()) {
      return NextResponse.json(
        { error: 'Feedback is required' },
        { status: 400 }
      )
    }

    const webhookUrl = process.env.DISCORD_WEBHOOK_URL

    if (!webhookUrl) {
      console.warn('DISCORD_WEBHOOK_URL not configured')
      return NextResponse.json(
        { error: 'Feedback service not configured' },
        { status: 503 }
      )
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: '💬 Feedback ใหม่',
          description: feedback,
          color: 0x5865F2,
          timestamp: new Date().toISOString(),
          footer: { text: '2026 Vision Board - Anonymous Feedback' }
        }]
      })
    })

    if (!response.ok) {
      throw new Error(`Discord webhook failed: ${response.status}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Feedback API error:', error)
    return NextResponse.json(
      { error: 'Failed to send feedback' },
      { status: 500 }
    )
  }
}
