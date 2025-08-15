import type { Observation, TimeScale, MockTraceData } from "./types"

// Build parent-child relationships and compute derived fields
export function normalizeObservations(observations: Observation[]): Observation[] {
  const observationMap = new Map<string, Observation>()

  // First pass: create map and initialize
  observations.forEach((obs) => {
    observationMap.set(obs.id, {
      ...obs,
      children: [],
      depth: 0,
      duration: obs.endTime ? new Date(obs.endTime).getTime() - new Date(obs.startTime).getTime() : null,
      hasError: obs.status === "error",
    })
  })

  // Second pass: build parent-child relationships and compute depth
  const rootObservations: Observation[] = []

  observationMap.forEach((obs) => {
    if (obs.parentObservationId) {
      const parent = observationMap.get(obs.parentObservationId)
      if (parent) {
        parent.children!.push(obs)
        obs.depth = (parent.depth || 0) + 1
      }
    } else {
      rootObservations.push(obs)
    }
  })

  // Sort children by start time
  observationMap.forEach((obs) => {
    obs.children!.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
  })

  return rootObservations.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
}

// Flatten tree into rows for virtualization (DFS traversal)
export function flattenToRows(observations: Observation[], expandedIds: Set<string>): Observation[] {
  const rows: Observation[] = []

  function traverse(obs: Observation) {
    rows.push(obs)

    if (expandedIds.has(obs.id) && obs.children?.length) {
      obs.children.forEach(traverse)
    }
  }

  observations.forEach(traverse)
  return rows
}

// Create time scale for timeline rendering
export function createTimeScale(
  observations: Observation[],
  width: number,
  windowStart?: number,
  windowEnd?: number,
): TimeScale {
  if (observations.length === 0) {
    return {
      domain: [0, 1],
      range: [0, width],
      timeToX: () => 0,
      xToTime: () => 0,
      tickValues: [],
      tickFormat: () => "",
    }
  }

  // Find time bounds
  let minTime = Number.POSITIVE_INFINITY
  let maxTime = Number.NEGATIVE_INFINITY

  function findBounds(obs: Observation) {
    const start = new Date(obs.startTime).getTime()
    const end = obs.endTime ? new Date(obs.endTime).getTime() : start

    minTime = Math.min(minTime, start)
    maxTime = Math.max(maxTime, end)

    obs.children?.forEach(findBounds)
  }

  observations.forEach(findBounds)

  // Use window bounds if provided
  const domainStart = windowStart ?? minTime
  const domainEnd = windowEnd ?? maxTime
  const domainWidth = domainEnd - domainStart

  const timeToX = (time: number) => ((time - domainStart) / domainWidth) * width

  const xToTime = (x: number) => domainStart + (x / width) * domainWidth

  // Generate tick values
  const tickCount = Math.max(5, Math.min(20, Math.floor(width / 100)))
  const tickValues: number[] = []
  for (let i = 0; i <= tickCount; i++) {
    tickValues.push(domainStart + (i / tickCount) * domainWidth)
  }

  const tickFormat = (time: number) => {
    const date = new Date(time)
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
    })
  }

  return {
    domain: [domainStart, domainEnd],
    range: [0, width],
    timeToX,
    xToTime,
    tickValues,
    tickFormat,
  }
}

// Generate mock data for development
export function generateMockTraceData(): MockTraceData {
  const traceId = "trace-" + Math.random().toString(36).substr(2, 9)
  const baseTime = Date.now() - 10000 // 10 seconds ago

  const trace = {
    id: traceId,
    name: "AI Agent Workflow",
    userId: "user-123",
    startTime: new Date(baseTime).toISOString(),
    endTime: new Date(baseTime + 8000).toISOString(),
    metadata: { version: "1.0", environment: "production" },
  }

  const observations: Observation[] = [
    {
      id: "obs-1",
      traceId,
      type: "span",
      name: "Planning Phase",
      startTime: new Date(baseTime).toISOString(),
      endTime: new Date(baseTime + 2000).toISOString(),
      status: "ok",
    },
    {
      id: "obs-2",
      traceId,
      parentObservationId: "obs-1",
      type: "generation",
      name: "Generate Plan",
      startTime: new Date(baseTime + 100).toISOString(),
      endTime: new Date(baseTime + 1800).toISOString(),
      status: "ok",
      model: "gpt-4o",
      usage: { promptTokens: 150, completionTokens: 300, costUSD: 0.02 },
      input: { prompt: "Create a plan for the user request" },
      output: { plan: "Step 1: Analyze requirements..." },
    },
    {
      id: "obs-3",
      traceId,
      type: "span",
      name: "Execution Phase",
      startTime: new Date(baseTime + 2100).toISOString(),
      endTime: new Date(baseTime + 7500).toISOString(),
      status: "ok",
    },
    {
      id: "obs-4",
      traceId,
      parentObservationId: "obs-3",
      type: "generation",
      name: "Execute Step 1",
      startTime: new Date(baseTime + 2200).toISOString(),
      endTime: new Date(baseTime + 4000).toISOString(),
      status: "ok",
      model: "gpt-4o",
      usage: { promptTokens: 200, completionTokens: 450, costUSD: 0.035 },
    },
    {
      id: "obs-5",
      traceId,
      parentObservationId: "obs-3",
      type: "generation",
      name: "Execute Step 2",
      startTime: new Date(baseTime + 4100).toISOString(),
      endTime: new Date(baseTime + 6800).toISOString(),
      status: "error",
      model: "gpt-4o",
      usage: { promptTokens: 180, completionTokens: 0, costUSD: 0.01 },
    },
    {
      id: "obs-6",
      traceId,
      parentObservationId: "obs-3",
      type: "event",
      name: "Retry Triggered",
      startTime: new Date(baseTime + 6900).toISOString(),
      status: "ok",
    },
    {
      id: "obs-7",
      traceId,
      parentObservationId: "obs-3",
      type: "generation",
      name: "Retry Step 2",
      startTime: new Date(baseTime + 7000).toISOString(),
      endTime: new Date(baseTime + 7400).toISOString(),
      status: "ok",
      model: "gpt-4o",
      usage: { promptTokens: 180, completionTokens: 200, costUSD: 0.025 },
    },
  ]

  return { trace, observations }
}
