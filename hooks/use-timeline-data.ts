"use client"

import { useState, useEffect, useMemo } from "react"
import type { MockTraceData } from "@/lib/types"
import { normalizeObservations, generateMockTraceData } from "@/lib/timeline-utils"

export function useTimelineData(traceId?: string) {
  const [data, setData] = useState<MockTraceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Simulate API call with mock data
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // In real implementation, this would be:
        // const response = await fetch(`/api/traces/${traceId}`);
        // const data = await response.json();

        // For now, generate mock data
        await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate network delay
        const mockData = generateMockTraceData()
        setData(mockData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch trace data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [traceId])

  const normalizedObservations = useMemo(() => {
    if (!data?.observations) return []
    return normalizeObservations(data.observations)
  }, [data?.observations])

  return {
    trace: data?.trace,
    observations: normalizedObservations,
    isLoading,
    error,
    refetch: () => {
      const mockData = generateMockTraceData()
      setData(mockData)
    },
  }
}
