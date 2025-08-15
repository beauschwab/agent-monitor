// Core data types matching Langfuse's trace and observation model
export type ObservationType = "event" | "span" | "generation"

export type ObservationStatus = "ok" | "error" | "cancelled" | "unknown"

export interface Trace {
  id: string
  name?: string
  userId?: string | null
  startTime: string // ISO timestamp
  endTime?: string | null
  metadata?: Record<string, any>
}

export interface Usage {
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
  costUSD?: number
}

export interface Observation {
  id: string
  traceId: string
  parentObservationId?: string | null
  type: ObservationType
  name: string
  startTime: string // ISO timestamp
  endTime?: string | null // null means in-progress
  status?: ObservationStatus
  model?: string // for generations
  usage?: Usage | null
  input?: any
  output?: any
  metadata?: Record<string, any>
  // Computed fields for UI
  children?: Observation[]
  depth?: number
  duration?: number // milliseconds
  hasError?: boolean
}

// Normalized data structure for efficient rendering
export interface TimelineRow {
  id: string
  observation: Observation
  depth: number
  isExpanded: boolean
  hasChildren: boolean
  childCount: number
  startX: number // pixel position
  width: number // pixel width
  y: number // row index
}

// Timeline state and controls
export interface TimelineState {
  // Time window
  windowStart: number // timestamp
  windowEnd: number // timestamp

  // View state
  selectedObservationId?: string
  expandedIds: Set<string>
  hoveredObservationId?: string

  // Filters
  typeFilter: Set<ObservationType>
  statusFilter: Set<ObservationStatus>
  modelFilter: Set<string>
  searchQuery: string

  // Layout
  rowHeight: number
  canvasWidth: number
  canvasHeight: number

  // Scroll sync
  treeScrollTop: number
  timelineScrollTop: number
}

// Time scale utilities
export interface TimeScale {
  domain: [number, number] // [minTime, maxTime]
  range: [number, number] // [0, width]
  timeToX: (time: number) => number
  xToTime: (x: number) => number
  tickValues: number[]
  tickFormat: (time: number) => string
}

// Mock data for development
export interface MockTraceData {
  trace: Trace
  observations: Observation[]
}
