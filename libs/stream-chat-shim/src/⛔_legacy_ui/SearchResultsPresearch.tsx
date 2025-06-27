// libs/stream-chat-shim/src/SearchResultsPresearch.tsx
'use client'
import React from 'react'
import type { SearchSource } from 'chat-shim'

export type SearchResultsPresearchProps = {
  activeSources: SearchSource[]
}

/** Placeholder implementation of the SearchResultsPresearch component. */
export const SearchResultsPresearch = (
  _props: SearchResultsPresearchProps
) => {
  return (
    <div data-testid="search-results-presearch-placeholder">
      Start typing to search
    </div>
  )
}

export default SearchResultsPresearch
