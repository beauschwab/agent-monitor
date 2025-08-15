"use client"

import {
  ChevronDown,
  ChevronRight,
  Clock,
  Zap,
  Circle,
  CheckCircle,
  XCircle,
  Wrench,
  AlertTriangle,
  Play,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TooltipProvider } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { createTimeScale } from "@/lib/timeline-utils"
import type { Observation, ObservationType, ObservationStatus } from "@/lib/types"
import { useMemo } from "react"

interface TimelineTreeIntegratedProps {
  observations: Observation[]
  expandedIds: Set<string>
  selectedId?: string
  onToggleExpand: (id: string) => void
  onSelect: (id: string) => void
  className?: string
}

interface TimelineTreeRowProps {
  observation: Observation
  isExpanded: boolean
  isSelected: boolean
  onToggleExpand: (id: string) => void
  onSelect: (id: string) => void
  timeScale: any
  timelineWidth: number
}

// Get icon for observation type
function getObservationIcon(type: ObservationType, status?: ObservationStatus) {
  if (status === "error") {
    return <XCircle className="h-4 w-4 text-destructive" />
  }

  switch (type) {
    case "generation":
      return <Zap className="h-4 w-4 text-chart-1" />
    case "span":
      return <Clock className="h-4 w-4 text-chart-2" />
    case "event":
      return <Circle className="h-3 w-3 text-chart-3" />
    default:
      return <Circle className="h-4 w-4 text-muted-foreground" />
  }
}

// Get status icon
function getStatusIcon(status?: ObservationStatus) {
  switch (status) {
    case "ok":
      return <CheckCircle className="h-3 w-3 text-green-500" />
    case "error":
      return <XCircle className="h-3 w-3 text-destructive" />
    case "cancelled":
      return <XCircle className="h-3 w-3 text-yellow-500" />
    default:
      return null
  }
}

// Format duration
function formatDuration(duration?: number | null): string {
  if (!duration) return "—"

  if (duration < 1000) {
    return `${Math.round(duration)}ms`
  } else if (duration < 60000) {
    return `${(duration / 1000).toFixed(2)}s`
  } else {
    const minutes = Math.floor(duration / 60000)
    const seconds = ((duration % 60000) / 1000).toFixed(0)
    return `${minutes}m ${seconds}s`
  }
}

// Get color for observation type
function getObservationColor(obs: Observation) {
  if (obs.status === "error") return "bg-red-500"

  switch (obs.type) {
    case "generation":
      return "bg-emerald-500" // Supabase green
    case "span":
      return "bg-blue-500"
    case "event":
      return "bg-amber-500"
    default:
      return "bg-gray-500"
  }
}

interface MilestoneMarker {
  id: string
  time: number
  type: "tool_call" | "error" | "completion" | "start" | "warning"
  label: string
  data?: any
}

// Get icon for milestone type
function getMilestoneIcon(type: MilestoneMarker["type"]) {
  switch (type) {
    case "tool_call":
      return <Wrench className="h-3 w-3 text-blue-400" />
    case "error":
      return <XCircle className="h-3 w-3 text-red-400" />
    case "completion":
      return <CheckCircle className="h-3 w-3 text-green-400" />
    case "start":
      return <Play className="h-3 w-3 text-emerald-400" />
    case "warning":
      return <AlertTriangle className="h-3 w-3 text-yellow-400" />
    default:
      return <Circle className="h-3 w-3 text-gray-400" />
  }
}

function generateMilestones(observation: Observation): MilestoneMarker[] {
  const milestones: MilestoneMarker[] = []
  const startTime = new Date(observation.startTime).getTime()
  const endTime = observation.endTime ? new Date(observation.endTime).getTime() : startTime + 100
  const duration = endTime - startTime

  // Start milestone
  milestones.push({
    id: `${observation.id}-start`,
    time: startTime,
    type: "start",
    label: "Started",
  })

  // Tool calls for generations
  if (observation.type === "generation" && observation.input) {
    try {
      const input = typeof observation.input === "string" ? JSON.parse(observation.input) : observation.input
      if (input.tool_calls && Array.isArray(input.tool_calls)) {
        input.tool_calls.forEach((toolCall: any, index: number) => {
          milestones.push({
            id: `${observation.id}-tool-${index}`,
            time: startTime + duration * 0.3 + index * 100, // Spread tool calls across timeline
            type: "tool_call",
            label: `Tool: ${toolCall.function?.name || "Unknown"}`,
            data: toolCall,
          })
        })
      }
    } catch (e) {
      // Ignore parsing errors
    }
  }

  // Error milestone
  if (observation.status === "error") {
    milestones.push({
      id: `${observation.id}-error`,
      time: endTime - duration * 0.1, // Near the end
      type: "error",
      label: "Error occurred",
    })
  }

  // Completion milestone
  if (observation.endTime && observation.status === "ok") {
    milestones.push({
      id: `${observation.id}-completion`,
      time: endTime,
      type: "completion",
      label: "Completed",
    })
  }

  // Warning for long operations
  if (duration > 5000) {
    // More than 5 seconds
    milestones.push({
      id: `${observation.id}-warning`,
      time: startTime + duration * 0.7,
      type: "warning",
      label: "Long operation",
    })
  }

  return milestones
}

function TimelineTreeRow({
  observation,
  isExpanded,
  isSelected,
  onToggleExpand,
  onSelect,
  timeScale,
  timelineWidth,
}: TimelineTreeRowProps) {
  const hasChildren = observation.children && observation.children.length > 0
  const depth = observation.depth || 0

  // Calculate timeline bar position and width
  const startTime = new Date(observation.startTime).getTime()
  const endTime = observation.endTime ? new Date(observation.endTime).getTime() : startTime + 100

  const barStartX = timeScale.timeToX(startTime)
  const barEndX = timeScale.timeToX(endTime)
  const barWidth = Math.max(4, barEndX - barStartX) // Minimum 4px width

  const milestones = generateMilestones(observation)

  return (
    <div
      className={cn(
        "group relative flex items-center h-8 text-sm hover:bg-accent/50 cursor-pointer border-l-2 border-transparent",
        isSelected && "bg-accent border-l-primary",
        "transition-colors",
      )}
      onClick={() => onSelect(observation.id)}
    >
      {/* Left side - Tree structure */}
      <div
        className="flex items-center gap-2 px-2 z-10 bg-background/90 backdrop-blur-sm"
        style={{ paddingLeft: `${depth * 20 + 8}px`, minWidth: "300px" }}
      >
        {/* Expand/Collapse Button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-4 w-4 p-0 hover:bg-accent"
          onClick={(e) => {
            e.stopPropagation()
            if (hasChildren) {
              onToggleExpand(observation.id)
            }
          }}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )
          ) : (
            <div className="h-3 w-3" />
          )}
        </Button>

        {/* Type Icon */}
        <div className="flex-shrink-0">{getObservationIcon(observation.type, observation.status)}</div>

        {/* Name and Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate text-xs">{observation.name}</span>
            {observation.status && getStatusIcon(observation.status)}
            {observation.model && (
              <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
                {observation.model}
              </Badge>
            )}
          </div>
        </div>

        {/* Duration */}
        <div className="text-xs text-muted-foreground">{formatDuration(observation.duration)}</div>

        {/* Cost */}
        {observation.usage?.costUSD && (
          <div className="text-xs text-green-600 dark:text-green-400">${observation.usage.costUSD.toFixed(4)}</div>
        )}
      </div>

      {/* Timeline bar overlay */}
      <div className="absolute inset-0 flex items-center pointer-events-none" style={{ paddingLeft: "300px" }}>
        <div className="relative w-full h-full">
          {/* Timeline bar */}
          <div
            className={cn(
              "absolute top-1 bottom-1 rounded-sm opacity-80",
              getObservationColor(observation),
              isSelected && "ring-2 ring-primary ring-offset-1",
            )}
            style={{
              left: `${(barStartX / timelineWidth) * 100}%`,
              width: `${(barWidth / timelineWidth) * 100}%`,
              minWidth: "4px",
            }}
          >
            {/* Bar label for wider bars */}
            {barWidth > 60 && (
              <div className="absolute inset-0 flex items-center px-2">
                <span className="text-white text-xs font-medium truncate">{observation.name}</span>
              </div>
            )}
          </div>

          {milestones.map((milestone) => {
            const markerX = timeScale.timeToX(milestone.time)
            const markerPosition = (markerX / timelineWidth) * 100

            return (
              <div
                key={milestone.id}
                className="absolute top-0 bottom-0 flex items-center pointer-events-auto cursor-pointer z-20 group/marker"
                style={{ left: `${markerPosition}%` }}
                title={milestone.label}
              >
                <div className="relative">
                  {/* Milestone icon */}
                  <div className="bg-background border border-border rounded-full p-0.5 shadow-sm group-hover/marker:scale-110 transition-transform">
                    {getMilestoneIcon(milestone.type)}
                  </div>

                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover/marker:opacity-100 transition-opacity whitespace-nowrap z-30">
                    {milestone.label}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-popover"></div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Actions Menu */}
      <div className="absolute right-2 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Circle className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(observation.id)}>Copy ID</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSelect(observation.id)}>View Details</DropdownMenuItem>
            {observation.type === "generation" && <DropdownMenuItem>Copy Prompt</DropdownMenuItem>}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export function TimelineTreeIntegrated({
  observations,
  expandedIds,
  selectedId,
  onToggleExpand,
  onSelect,
  className,
}: TimelineTreeIntegratedProps) {
  // Create time scale
  const timeScale = useMemo(() => {
    return createTimeScale(observations, 500) // 500px timeline width
  }, [observations])

  // Flatten observations for rendering
  const flattenObservations = (obs: Observation[]): Observation[] => {
    const result: Observation[] = []

    const traverse = (observation: Observation) => {
      result.push(observation)

      if (expandedIds.has(observation.id) && observation.children?.length) {
        observation.children.forEach(traverse)
      }
    }

    obs.forEach(traverse)
    return result
  }

  const flatObservations = flattenObservations(observations)

  // Generate time markers
  const timeMarkers = timeScale.tickValues.map((time: number) => ({
    time,
    position: (timeScale.timeToX(time) / 500) * 100, // Convert to percentage
    label: new Date(time).toLocaleTimeString("en-US", {
      hour12: false,
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 1,
    }),
  }))

  return (
    <TooltipProvider>
      <div className={cn("flex flex-col h-full", className)}>
        {/* Header with time markers */}
        <div className="flex border-b bg-muted/30">
          {/* Tree header */}
          <div className="w-[300px] flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm">Trace Timeline</h3>
              <Badge variant="outline" className="text-xs">
                {flatObservations.length}
              </Badge>
            </div>
          </div>

          {/* Timeline header */}
          <div className="flex-1 relative h-12 border-l">
            {timeMarkers.map((marker, index) => (
              <div
                key={index}
                className="absolute top-0 bottom-0 flex flex-col justify-center border-l border-border/30"
                style={{ left: `${marker.position}%` }}
              >
                <div className="text-xs text-muted-foreground px-2">{marker.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tree Content with Timeline Overlay */}
        <ScrollArea className="flex-1">
          <div className="relative">
            {/* Background grid lines */}
            <div className="absolute inset-0 pointer-events-none" style={{ paddingLeft: "300px" }}>
              {timeMarkers.map((marker, index) => (
                <div
                  key={index}
                  className="absolute top-0 bottom-0 w-px bg-border/20"
                  style={{ left: `${marker.position}%` }}
                />
              ))}
            </div>

            {/* Tree rows with timeline bars */}
            {flatObservations.map((observation) => (
              <TimelineTreeRow
                key={observation.id}
                observation={observation}
                isExpanded={expandedIds.has(observation.id)}
                isSelected={selectedId === observation.id}
                onToggleExpand={onToggleExpand}
                onSelect={onSelect}
                timeScale={timeScale}
                timelineWidth={500}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
    </TooltipProvider>
  )
}
