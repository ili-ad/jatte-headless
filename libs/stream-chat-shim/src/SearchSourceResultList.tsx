// libs/stream-chat-shim/src/SearchSourceResultList.tsx
'use client'
import React, { type ComponentType } from 'react'

// Replicates the item component map used by Stream's implementation
export type SearchResultItemComponents = Record<string, ComponentType<{ item: any }>>

export type SearchSourceResultListProps = {
  loadMoreDebounceMs?: number
  loadMoreThresholdPx?: number
  SearchResultItems?: SearchResultItemComponents
}

/**
 * Minimal placeholder for Stream's SearchSourceResultList component.
 */
export const SearchSourceResultList = (
  _props: SearchSourceResultListProps,
) => {
  return (
    <div data-testid="search-source-result-list-placeholder">
      SearchSourceResultList placeholder
    </div>
  )
}

export default SearchSourceResultList
