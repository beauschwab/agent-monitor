"use client"

import {
  Search,
  Filter,
  ExpandIcon as ExpandAll,
  ListCollapseIcon as CollapseAll,
  RefreshCw,
  Calendar,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import type { ObservationType, ObservationStatus } from "@/lib/types"

export type TimeRange = "30min" | "2hours" | "today" | "week" | "custom"

interface DateRange {
  from: Date | undefined
  to: Date | undefined
}

interface TreeToolbarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  typeFilter: Set<ObservationType>
  onTypeFilterChange: (types: Set<ObservationType>) => void
  statusFilter: Set<ObservationStatus>
  onStatusFilterChange: (statuses: Set<ObservationStatus>) => void
  timeRange: TimeRange
  onTimeRangeChange: (range: TimeRange) => void
  customDateRange: DateRange
  onCustomDateRangeChange: (range: DateRange) => void
  onExpandAll: () => void
  onCollapseAll: () => void
  onRefresh: () => void
  totalCount: number
  filteredCount: number
}

const OBSERVATION_TYPES: { value: ObservationType; label: string; color: string }[] = [
  { value: "generation", label: "Generation", color: "bg-chart-1" },
  { value: "span", label: "Span", color: "bg-chart-2" },
  { value: "event", label: "Event", color: "bg-chart-3" },
]

const OBSERVATION_STATUSES: { value: ObservationStatus; label: string; color: string }[] = [
  { value: "ok", label: "Success", color: "bg-green-500" },
  { value: "error", label: "Error", color: "bg-destructive" },
  { value: "cancelled", label: "Cancelled", color: "bg-yellow-500" },
  { value: "unknown", label: "Unknown", color: "bg-muted-foreground" },
]

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: "30min", label: "Last 30 min" },
  { value: "2hours", label: "Last 2 Hours" },
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "custom", label: "Custom Range" },
]

export function TreeToolbar({
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
  timeRange,
  onTimeRangeChange,
  customDateRange,
  onCustomDateRangeChange,
  onExpandAll,
  onCollapseAll,
  onRefresh,
  totalCount,
  filteredCount,
}: TreeToolbarProps) {
  const activeFiltersCount =
    (typeFilter.size > 0 && typeFilter.size < 3 ? 1 : 0) +
    (statusFilter.size > 0 && statusFilter.size < 4 ? 1 : 0) +
    (timeRange !== "today" ? 1 : 0)

  const getTimeRangeLabel = () => {
    if (timeRange === "custom" && customDateRange.from) {
      if (customDateRange.to) {
        return `${format(customDateRange.from, "MMM d")} - ${format(customDateRange.to, "MMM d")}`
      }
      return format(customDateRange.from, "MMM d, yyyy")
    }
    return TIME_RANGES.find((r) => r.value === timeRange)?.label || "Today"
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2 p-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search observations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>

        {/* Time Range Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 bg-transparent">
              <Clock className="h-3 w-3 mr-1" />
              {getTimeRangeLabel()}
              {timeRange !== "today" && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                  1
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Time Range</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {TIME_RANGES.filter((r) => r.value !== "custom").map((range) => (
              <DropdownMenuCheckboxItem
                key={range.value}
                checked={timeRange === range.value}
                onCheckedChange={() => onTimeRangeChange(range.value)}
              >
                {range.label}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            <div className="p-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <Calendar className="h-3 w-3 mr-2" />
                    Custom Range
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="range"
                    selected={customDateRange}
                    onSelect={(range) => {
                      onCustomDateRangeChange(range || { from: undefined, to: undefined })
                      if (range?.from) {
                        onTimeRangeChange("custom")
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Type Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 bg-transparent">
              <Filter className="h-3 w-3 mr-1" />
              Type
              {typeFilter.size > 0 && typeFilter.size < 3 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                  {typeFilter.size}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {OBSERVATION_TYPES.map((type) => (
              <DropdownMenuCheckboxItem
                key={type.value}
                checked={typeFilter.has(type.value)}
                onCheckedChange={(checked) => {
                  const newFilter = new Set(typeFilter)
                  if (checked) {
                    newFilter.add(type.value)
                  } else {
                    newFilter.delete(type.value)
                  }
                  onTypeFilterChange(newFilter)
                }}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${type.color}`} />
                  {type.label}
                </div>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 bg-transparent">
              <Filter className="h-3 w-3 mr-1" />
              Status
              {statusFilter.size > 0 && statusFilter.size < 4 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                  {statusFilter.size}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {OBSERVATION_STATUSES.map((status) => (
              <DropdownMenuCheckboxItem
                key={status.value}
                checked={statusFilter.has(status.value)}
                onCheckedChange={(checked) => {
                  const newFilter = new Set(statusFilter)
                  if (checked) {
                    newFilter.add(status.value)
                  } else {
                    newFilter.delete(status.value)
                  }
                  onStatusFilterChange(newFilter)
                }}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${status.color}`} />
                  {status.label}
                </div>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Expand/Collapse Actions */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onExpandAll} className="h-8 w-8 p-0">
                <ExpandAll className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Expand All</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onCollapseAll} className="h-8 w-8 p-0">
                <CollapseAll className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Collapse All</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onRefresh} className="h-8 w-8 p-0">
                <RefreshCw className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refresh</TooltipContent>
          </Tooltip>
        </div>

        {/* Results Count */}
        {filteredCount !== totalCount && (
          <div className="text-xs text-muted-foreground whitespace-nowrap">
            {filteredCount} of {totalCount}
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
