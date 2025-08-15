"use client"

import { useState, useMemo, useCallback } from "react"
import type { Observation, ObservationType, ObservationStatus } from "@/lib/types"

interface UseTreeStateProps {
  observations: Observation[]
}

export function useTreeState({ observations }: UseTreeStateProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [selectedId, setSelectedId] = useState<string>()
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<Set<ObservationType>>(new Set())
  const [statusFilter, setStatusFilter] = useState<Set<ObservationStatus>>(new Set())

  // Filter observations based on search and filters
  const filteredObservations = useMemo(() => {
    const filterObservation = (obs: Observation): Observation | null => {
      // Apply search filter
      if (searchQuery && !obs.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return null
      }

      // Apply type filter
      if (typeFilter.size > 0 && !typeFilter.has(obs.type)) {
        return null
      }

      // Apply status filter
      if (statusFilter.size > 0 && obs.status && !statusFilter.has(obs.status)) {
        return null
      }

      // Recursively filter children
      const filteredChildren = (obs.children?.map(filterObservation).filter(Boolean) as Observation[]) || []

      return {
        ...obs,
        children: filteredChildren,
      }
    }

    return observations.map(filterObservation).filter(Boolean) as Observation[]
  }, [observations, searchQuery, typeFilter, statusFilter])

  // Count total observations (including children)
  const totalCount = useMemo(() => {
    const countObservations = (obs: Observation[]): number => {
      return obs.reduce((count, observation) => {
        return count + 1 + countObservations(observation.children || [])
      }, 0)
    }
    return countObservations(observations)
  }, [observations])

  const filteredCount = useMemo(() => {
    const countObservations = (obs: Observation[]): number => {
      return obs.reduce((count, observation) => {
        return count + 1 + countObservations(observation.children || [])
      }, 0)
    }
    return countObservations(filteredObservations)
  }, [filteredObservations])

  // Actions
  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  const expandAll = useCallback(() => {
    const getAllIds = (obs: Observation[]): string[] => {
      return obs.reduce((ids: string[], observation) => {
        if (observation.children?.length) {
          ids.push(observation.id)
          ids.push(...getAllIds(observation.children))
        }
        return ids
      }, [])
    }
    setExpandedIds(new Set(getAllIds(filteredObservations)))
  }, [filteredObservations])

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set())
  }, [])

  const selectObservation = useCallback((id: string) => {
    setSelectedId(id)
  }, [])

  return {
    // State
    expandedIds,
    selectedId,
    searchQuery,
    typeFilter,
    statusFilter,
    filteredObservations,
    totalCount,
    filteredCount,

    // Actions
    toggleExpand,
    expandAll,
    collapseAll,
    selectObservation,
    setSearchQuery,
    setTypeFilter,
    setStatusFilter,
  }
}
