"use client"

import { useState } from "react"
import { useTimelineData } from "@/hooks/use-timeline-data"
import { useTreeState } from "@/hooks/use-tree-state"
import { TreeToolbar, type TimeRange } from "@/components/tree-toolbar"
import { TimelineTreeIntegrated } from "@/components/timeline-tree-integrated"
import { ObservationDrawer } from "@/components/observation-drawer"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
import type { Observation } from "@/lib/types"

interface DateRange {
  from: Date | undefined
  to: Date | undefined
}

export default function TraceTimelinePage() {
  const { trace, observations, isLoading, error, refetch } = useTimelineData()
  const treeState = useTreeState({ observations })

  const [selectedObservation, setSelectedObservation] = useState<Observation | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const [timeRange, setTimeRange] = useState<TimeRange>("today")
  const [customDateRange, setCustomDateRange] = useState<DateRange>({ from: undefined, to: undefined })

  const [drawerHeight, setDrawerHeight] = useState(400)

  const handleObservationSelect = (id: string) => {
    treeState.selectObservation(id)

    // Find the selected observation from the flattened list
    const findObservation = (obs: Observation[]): Observation | null => {
      for (const observation of obs) {
        if (observation.id === id) {
          return observation
        }
        if (observation.children?.length) {
          const found = findObservation(observation.children)
          if (found) return found
        }
      }
      return null
    }

    const selected = findObservation(observations)
    setSelectedObservation(selected)
    setIsDrawerOpen(!!selected)
  }

  const handleDrawerClose = () => {
    setIsDrawerOpen(false)
    setSelectedObservation(null)
    treeState.selectObservation("")
  }

  if (isLoading) {
    return (
      <div className="h-screen p-4 dark">
        <Skeleton className="h-full w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center dark">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-destructive mb-2">Error Loading Trace</h2>
          <p className="text-muted-foreground">{error}</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-screen bg-background dark">
      {/* Header */}
      <div className="border-b bg-card p-4">
        <h1 className="text-xl font-semibold text-foreground">{trace?.name || "Trace Timeline"}</h1>
        <p className="text-sm text-muted-foreground">Trace ID: {trace?.id}</p>
      </div>

      {/* Main Content */}
      <div className="h-[calc(100vh-80px)] flex flex-col">
        {/* Toolbar */}
        <div className="border-b">
          <TreeToolbar
            searchQuery={treeState.searchQuery}
            onSearchChange={treeState.setSearchQuery}
            typeFilter={treeState.typeFilter}
            onTypeFilterChange={treeState.setTypeFilter}
            statusFilter={treeState.statusFilter}
            onStatusFilterChange={treeState.setStatusFilter}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            customDateRange={customDateRange}
            onCustomDateRangeChange={setCustomDateRange}
            onExpandAll={treeState.expandAll}
            onCollapseAll={treeState.collapseAll}
            onRefresh={refetch}
            totalCount={treeState.totalCount}
            filteredCount={treeState.filteredCount}
          />
        </div>

        <div className="flex-1">
          <TimelineTreeIntegrated
            observations={treeState.filteredObservations}
            expandedIds={treeState.expandedIds}
            selectedId={treeState.selectedId}
            onToggleExpand={treeState.toggleExpand}
            onSelect={handleObservationSelect}
          />
        </div>
      </div>

      <ObservationDrawer
        observation={selectedObservation}
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        height={drawerHeight}
        onHeightChange={setDrawerHeight}
      />
    </div>
  )
}
