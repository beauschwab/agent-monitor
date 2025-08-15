"use client"

import { useState } from "react"
import { X, Copy, Clock, DollarSign, Cpu, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { Observation } from "@/lib/types"

interface ObservationDrawerProps {
  observation: Observation | null
  isOpen: boolean
  onClose: () => void
}

// JSON Viewer Component
function JsonViewer({ data, title }: { data: any; title: string }) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  if (!data) {
    return <div className="text-sm text-muted-foreground italic">No {title.toLowerCase()} data</div>
  }

  const jsonString = JSON.stringify(data, null, 2)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">{title}</h4>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(!isCollapsed)} className="h-6 px-2">
            {isCollapsed ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigator.clipboard.writeText(jsonString)}
            className="h-6 px-2"
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="bg-muted/50 rounded-md p-3 text-xs font-mono overflow-x-auto">
          <pre className="whitespace-pre-wrap">{jsonString}</pre>
        </div>
      )}
    </div>
  )
}

// Metadata Card Component
function MetadataCard({ observation }: { observation: Observation }) {
  const formatDuration = (duration?: number | null): string => {
    if (!duration) return "—"
    if (duration < 1000) return `${Math.round(duration)}ms`
    if (duration < 60000) return `${(duration / 1000).toFixed(2)}s`
    const minutes = Math.floor(duration / 60000)
    const seconds = ((duration % 60000) / 1000).toFixed(0)
    return `${minutes}m ${seconds}s`
  }

  const formatCost = (cost?: number): string => {
    if (!cost) return "—"
    return `$${cost.toFixed(6)}`
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Execution Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Duration</div>
            <div className="font-medium">{formatDuration(observation.duration)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Status</div>
            <Badge variant={observation.status === "error" ? "destructive" : "default"}>
              {observation.status || "completed"}
            </Badge>
          </div>
          <div>
            <div className="text-muted-foreground">Start Time</div>
            <div className="font-mono text-xs">{new Date(observation.startTime).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-muted-foreground">End Time</div>
            <div className="font-mono text-xs">
              {observation.endTime ? new Date(observation.endTime).toLocaleString() : "—"}
            </div>
          </div>
        </div>

        {observation.model && (
          <>
            <Separator />
            <div>
              <div className="text-muted-foreground text-sm mb-1">Model</div>
              <Badge variant="secondary">{observation.model}</Badge>
            </div>
          </>
        )}

        {observation.usage && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Cpu className="h-4 w-4" />
                Token Usage
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Input</div>
                  <div className="font-medium">{observation.usage.inputTokens || 0}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Output</div>
                  <div className="font-medium">{observation.usage.outputTokens || 0}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Total</div>
                  <div className="font-medium">{observation.usage.totalTokens || 0}</div>
                </div>
              </div>
              {observation.usage.costUSD && (
                <div className="flex items-center gap-2 pt-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-sm">
                    <span className="text-muted-foreground">Cost: </span>
                    <span className="font-medium text-green-600">{formatCost(observation.usage.costUSD)}</span>
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export function ObservationDrawer({ observation, isOpen, onClose }: ObservationDrawerProps) {
  if (!observation) return null

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 bg-background border-t shadow-lg transition-transform duration-300 ease-in-out",
        isOpen ? "translate-y-0" : "translate-y-full",
      )}
      style={{ height: "60vh" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="font-semibold">{observation.name}</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline" className="text-xs">
                {observation.type}
              </Badge>
              <span>•</span>
              <span className="font-mono">{observation.id}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(observation.id)}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="overview" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-4 mx-4 mt-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="input">Input</TabsTrigger>
            <TabsTrigger value="output">Output</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="overview" className="h-full m-0">
              <ScrollArea className="h-full px-4 pb-4">
                <div className="space-y-4 pt-4">
                  <MetadataCard observation={observation} />

                  {observation.metadata && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Metadata</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <JsonViewer data={observation.metadata} title="Metadata" />
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="input" className="h-full m-0">
              <ScrollArea className="h-full px-4 pb-4">
                <div className="pt-4">
                  <JsonViewer data={observation.input} title="Input Data" />
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="output" className="h-full m-0">
              <ScrollArea className="h-full px-4 pb-4">
                <div className="pt-4">
                  <JsonViewer data={observation.output} title="Output Data" />
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="tools" className="h-full m-0">
              <ScrollArea className="h-full px-4 pb-4">
                <div className="pt-4">
                  {observation.type === "generation" && observation.input?.tools ? (
                    <div className="space-y-4">
                      <JsonViewer data={observation.input.tools} title="Available Tools" />
                      {observation.output?.toolCalls && (
                        <JsonViewer data={observation.output.toolCalls} title="Tool Calls" />
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground italic">
                      No tool data available for this observation
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
