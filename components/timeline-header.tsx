"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react"
import type { TimeScale } from "@/lib/types"

interface TimelineHeaderProps {
  timeScale: TimeScale
  onZoomIn: () => void
  onZoomOut: () => void
  onFitToWindow: () => void
  className?: string
}

export function TimelineHeader({ timeScale, onZoomIn, onZoomOut, onFitToWindow, className = "" }: TimelineHeaderProps) {
  const timeMarkers = useMemo(() => {
    return timeScale.tickValues.map((time) => ({
      time,
      x: timeScale.timeToX(time),
      label: timeScale.tickFormat(time),
    }))
  }, [timeScale])

  return (
    <div className={`border-b bg-card ${className}`}>
      {/* Controls */}
      <div className="flex items-center gap-2 px-4 py-2 border-b">
        <Button variant="outline" size="sm" onClick={onZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onFitToWindow}>
          <Maximize2 className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-4" />
        <span className="text-xs text-muted-foreground">
          {new Date(timeScale.domain[0]).toLocaleTimeString()} - {new Date(timeScale.domain[1]).toLocaleTimeString()}
        </span>
      </div>

      {/* Time Axis */}
      <div className="relative h-8 bg-muted/20">
        <svg className="absolute inset-0 w-full h-full">
          {timeMarkers.map((marker, i) => (
            <g key={i}>
              {/* Tick line */}
              <line
                x1={marker.x}
                y1={0}
                x2={marker.x}
                y2={32}
                stroke="currentColor"
                strokeWidth={1}
                className="text-border"
              />
              {/* Time label */}
              <text
                x={marker.x}
                y={24}
                textAnchor="middle"
                className="text-xs fill-muted-foreground"
                style={{ fontSize: "10px" }}
              >
                {marker.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  )
}
