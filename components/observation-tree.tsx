"use client"

import { ChevronDown, ChevronRight, Clock, Zap, Circle, CheckCircle, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TooltipProvider } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { Observation, ObservationType, ObservationStatus } from "@/lib/types"

interface ObservationTreeProps {
  observations: Observation[]
  expandedIds: Set<string>
  selectedId?: string
  onToggleExpand: (id: string) => void
  onSelect: (id: string) => void
  className?: string
}

interface ObservationTreeRowProps {
  observation: Observation
  isExpanded: boolean
  isSelected: boolean
  onToggleExpand: (id: string) => void
  onSelect: (id: string) => void
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

// Format cost
function formatCost(cost?: number): string {
  if (!cost) return ""
  return `$${cost.toFixed(4)}`
}

function ObservationTreeRow({
  observation,
  isExpanded,
  isSelected,
  onToggleExpand,
  onSelect,
}: ObservationTreeRowProps) {
  const hasChildren = observation.children && observation.children.length > 0
  const depth = observation.depth || 0

  return (
    <div
      className={cn(
        "group flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent/50 cursor-pointer border-l-2 border-transparent",
        isSelected && "bg-accent border-l-primary",
        "transition-colors",
      )}
      style={{ paddingLeft: `${depth * 20 + 8}px` }}
      onClick={() => onSelect(observation.id)}
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
          <span className="font-medium truncate">{observation.name}</span>

          {/* Status Icon */}
          {observation.status && getStatusIcon(observation.status)}

          {/* Model Badge */}
          {observation.model && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              {observation.model}
            </Badge>
          )}
        </div>

        {/* Duration and Cost */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
          <span>{formatDuration(observation.duration)}</span>

          {observation.usage?.costUSD && (
            <span className="text-green-600 dark:text-green-400">{formatCost(observation.usage.costUSD)}</span>
          )}

          {observation.usage?.totalTokens && <span>{observation.usage.totalTokens} tokens</span>}

          {hasChildren && <span>{observation.children!.length} children</span>}
        </div>
      </div>

      {/* Actions Menu */}
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
  )
}

export function ObservationTree({
  observations,
  expandedIds,
  selectedId,
  onToggleExpand,
  onSelect,
  className,
}: ObservationTreeProps) {
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

  return (
    <TooltipProvider>
      <div className={cn("flex flex-col h-full", className)}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Trace Tree</h3>
            <Badge variant="outline" className="text-xs">
              {flatObservations.length} observations
            </Badge>
          </div>
        </div>

        {/* Tree Content */}
        <ScrollArea className="flex-1">
          <div className="py-1">
            {flatObservations.map((observation) => (
              <ObservationTreeRow
                key={observation.id}
                observation={observation}
                isExpanded={expandedIds.has(observation.id)}
                isSelected={selectedId === observation.id}
                onToggleExpand={onToggleExpand}
                onSelect={onSelect}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
    </TooltipProvider>
  )
}
