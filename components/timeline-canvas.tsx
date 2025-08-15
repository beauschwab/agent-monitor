"use client"

import type React from "react"

import { useRef, useEffect, useMemo } from "react"
import { createTimeScale } from "@/lib/timeline-utils"
import type { Observation } from "@/lib/types"

interface TimelineCanvasProps {
  observations: Observation[]
  selectedId?: string
  onSelect?: (id: string) => void
  width?: number
  rowHeight?: number
  className?: string
}

const ROW_HEIGHT = 32
const CANVAS_WIDTH = 800

// Color mapping for different observation types
const getObservationColor = (obs: Observation) => {
  if (obs.status === "error") return "#ef4444" // red-500

  switch (obs.type) {
    case "generation":
      return "#10b981" // emerald-500 (Supabase green)
    case "span":
      return "#3b82f6" // blue-500
    case "event":
      return "#f59e0b" // amber-500
    default:
      return "#6b7280" // gray-500
  }
}

export function TimelineCanvas({
  observations,
  selectedId,
  onSelect,
  width = CANVAS_WIDTH,
  rowHeight = ROW_HEIGHT,
  className = "",
}: TimelineCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Create time scale
  const timeScale = useMemo(() => {
    return createTimeScale(observations, width)
  }, [observations, width])

  // Flatten observations for rendering
  const flatObservations = useMemo(() => {
    const result: Array<Observation & { y: number; depth: number }> = []

    function traverse(obs: Observation, depth = 0, yIndex = { current: 0 }) {
      const obsWithPosition = {
        ...obs,
        y: yIndex.current * rowHeight,
        depth,
      }
      result.push(obsWithPosition)
      yIndex.current++

      // Add children
      if (obs.children?.length) {
        obs.children.forEach((child) => traverse(child, depth + 1, yIndex))
      }
    }

    observations.forEach((obs) => traverse(obs))
    return result
  }, [observations, rowHeight])

  // Canvas height based on number of rows
  const canvasHeight = flatObservations.length * rowHeight

  // Draw timeline bars
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = width
    canvas.height = canvasHeight

    // Clear canvas
    ctx.clearRect(0, 0, width, canvasHeight)

    // Draw grid lines
    ctx.strokeStyle = "rgba(148, 163, 184, 0.1)" // slate-400 with opacity
    ctx.lineWidth = 1

    // Vertical grid lines (time markers)
    timeScale.tickValues.forEach((time) => {
      const x = timeScale.timeToX(time)
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvasHeight)
      ctx.stroke()
    })

    // Horizontal grid lines (row separators)
    for (let i = 0; i <= flatObservations.length; i++) {
      const y = i * rowHeight
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    // Draw observation bars
    flatObservations.forEach((obs) => {
      const startTime = new Date(obs.startTime).getTime()
      const endTime = obs.endTime ? new Date(obs.endTime).getTime() : startTime + 100 // Default width for events

      const x = timeScale.timeToX(startTime)
      const barWidth = Math.max(2, timeScale.timeToX(endTime) - x) // Minimum 2px width
      const y = obs.y + 4 // Add padding
      const barHeight = rowHeight - 8 // Leave padding top/bottom

      // Indent based on depth
      const indentX = x + obs.depth * 12
      const adjustedWidth = Math.max(2, barWidth - obs.depth * 12)

      // Set color
      ctx.fillStyle = getObservationColor(obs)

      // Draw bar with rounded corners
      ctx.beginPath()
      ctx.roundRect(indentX, y, adjustedWidth, barHeight, 3)
      ctx.fill()

      // Add selection highlight
      if (obs.id === selectedId) {
        ctx.strokeStyle = "#10b981" // emerald-500
        ctx.lineWidth = 2
        ctx.stroke()
      }

      // Draw text label for wider bars
      if (adjustedWidth > 60) {
        ctx.fillStyle = "white"
        ctx.font = "11px system-ui"
        ctx.textAlign = "left"
        ctx.textBaseline = "middle"

        const textX = indentX + 6
        const textY = y + barHeight / 2
        const maxTextWidth = adjustedWidth - 12

        // Truncate text if needed
        let text = obs.name
        const textWidth = ctx.measureText(text).width
        if (textWidth > maxTextWidth) {
          while (ctx.measureText(text + "...").width > maxTextWidth && text.length > 0) {
            text = text.slice(0, -1)
          }
          text += "..."
        }

        ctx.fillText(text, textX, textY)
      }
    })
  }, [flatObservations, timeScale, width, canvasHeight, selectedId, rowHeight])

  // Handle canvas clicks
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSelect) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // Find clicked observation
    const rowIndex = Math.floor(y / rowHeight)
    const clickedObs = flatObservations[rowIndex]

    if (clickedObs) {
      const startTime = new Date(clickedObs.startTime).getTime()
      const endTime = clickedObs.endTime ? new Date(clickedObs.endTime).getTime() : startTime + 100

      const barStartX = timeScale.timeToX(startTime) + clickedObs.depth * 12
      const barEndX = timeScale.timeToX(endTime)

      // Check if click is within the bar
      if (x >= barStartX && x <= barEndX) {
        onSelect(clickedObs.id)
      }
    }
  }

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="cursor-pointer"
        onClick={handleCanvasClick}
        style={{ width, height: canvasHeight }}
      />
    </div>
  )
}
