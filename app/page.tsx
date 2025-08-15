"use client"

import { useState } from "react"
import { useTimelineData } from "@/hooks/use-timeline-data"
import { useTreeState } from "@/hooks/use-tree-state"
import { TreeToolbar } from "@/components/tree-toolbar"
import { ObservationTree } from "@/components/observation-tree"
import { TimelineHeader } from "@/components/timeline-header"
import { TimelineCanvas } from "@/components/timeline-canvas"
import { ObservationDrawer } from "@/components/observation-drawer"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
import { createTimeScale } from "@/lib/timeline-utils"
import type { Observation } from "@/lib/types"

export default function TraceTimelinePage() {
  const { trace, observations, isLoading, error, refetch } = useTimelineData()
  const treeState = useTreeState({ observations })
  const [timelineWidth] = useState(800)

  const [selectedObservation, setSelectedObservation] = useState<Observation | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const timeScale = createTimeScale(observations, timelineWidth)

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

  const handleZoomIn = () => {
    // TODO: Implement zoom in logic
    console.log("Zoom in")
  }

  const handleZoomOut = () => {
    // TODO: Implement zoom out logic
    console.log("Zoom out")
  }

  const handleFitToWindow = () => {
    // TODO: Implement fit to window logic
    console.log("Fit to window")
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
      <div className="h-[calc(100vh-80px)]">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Panel - Tree View */}
          <ResizablePanel defaultSize={35} minSize={20}>
            <div className="h-full flex flex-col">
              <TreeToolbar
                searchQuery={treeState.searchQuery}
                onSearchChange={treeState.setSearchQuery}
                typeFilter={treeState.typeFilter}
                onTypeFilterChange={treeState.setTypeFilter}
                statusFilter={treeState.statusFilter}
                onStatusFilterChange={treeState.setStatusFilter}
                onExpandAll={treeState.expandAll}
                onCollapseAll={treeState.collapseAll}
                onRefresh={refetch}
                totalCount={treeState.totalCount}
                filteredCount={treeState.filteredCount}
              />

              <ObservationTree
                observations={treeState.filteredObservations}
                expandedIds={treeState.expandedIds}
                selectedId={treeState.selectedId}
                onToggleExpand={treeState.toggleExpand}
                onSelect={handleObservationSelect}
              />
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Right Panel - Timeline View */}
          <ResizablePanel>
            <div className="h-full flex flex-col">
              <TimelineHeader
                timeScale={timeScale}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onFitToWindow={handleFitToWindow}
              />

              <ScrollArea className="flex-1">
                <TimelineCanvas
                  observations={treeState.filteredObservations}
                  selectedId={treeState.selectedId}
                  onSelect={handleObservationSelect}
                  width={timelineWidth}
                  className="p-4"
                />
              </ScrollArea>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <ObservationDrawer observation={selectedObservation} isOpen={isDrawerOpen} onClose={handleDrawerClose} />
    </div>
  )
}
