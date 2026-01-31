'use client'

import { useEffect, useRef } from 'react'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'

function WarpCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    const lines: Array<{
      angle: number
      speed: number
      distance: number
      maxDistance: number
      opacity: number
      length: number
    }> = []

    const LINE_COUNT = 80

    function resize() {
      canvas!.width = window.innerWidth
      canvas!.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    function spawnLine() {
      const angle = Math.random() * Math.PI * 2
      return {
        angle,
        speed: 0.4 + Math.random() * 1.2,
        distance: 10 + Math.random() * 30,
        maxDistance: Math.max(canvas!.width, canvas!.height) * 0.9,
        opacity: 0,
        length: 20 + Math.random() * 60,
      }
    }

    // Initialize with staggered distances so they don't all start at once
    for (let i = 0; i < LINE_COUNT; i++) {
      const line = spawnLine()
      line.distance = Math.random() * line.maxDistance
      line.opacity = line.distance < 30 ? 0 : Math.min(0.4, (line.distance / line.maxDistance) * 0.5)
      lines.push(line)
    }

    function draw() {
      const w = canvas!.width
      const h = canvas!.height
      ctx!.clearRect(0, 0, w, h)

      const cx = w / 2
      const cy = h / 2

      for (const line of lines) {
        line.distance += line.speed
        const progress = line.distance / line.maxDistance

        // Fade in then out
        if (progress < 0.1) {
          line.opacity = progress / 0.1 * 0.35
        } else if (progress > 0.7) {
          line.opacity = (1 - progress) / 0.3 * 0.35
        } else {
          line.opacity = 0.35
        }

        // Accelerate and stretch as they move out
        const tailDist = Math.max(0, line.distance - line.length * (1 + progress * 2))
        const headX = cx + Math.cos(line.angle) * line.distance
        const headY = cy + Math.sin(line.angle) * line.distance
        const tailX = cx + Math.cos(line.angle) * tailDist
        const tailY = cy + Math.sin(line.angle) * tailDist

        const gradient = ctx!.createLinearGradient(tailX, tailY, headX, headY)
        gradient.addColorStop(0, `rgba(255,255,255,0)`)
        gradient.addColorStop(1, `rgba(255,255,255,${line.opacity})`)

        ctx!.beginPath()
        ctx!.moveTo(tailX, tailY)
        ctx!.lineTo(headX, headY)
        ctx!.strokeStyle = gradient
        ctx!.lineWidth = 1
        ctx!.stroke()

        // Reset when done
        if (line.distance > line.maxDistance) {
          Object.assign(line, spawnLine())
        }
      }

      animationId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    />
  )
}

export function ThemeBackground() {
  const { theme } = useSiteSettings()

  if (theme === 'dark-scifi') {
    return (
      <>
        <div className="theme-stars" aria-hidden="true" />
        <div className="theme-stars-twinkle" aria-hidden="true" />
      </>
    )
  }

  if (theme === 'startrek') {
    return (
      <>
        <WarpCanvas />
        <div className="theme-warp-vignette" aria-hidden="true" />
      </>
    )
  }

  return null
}
