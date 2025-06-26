// libs/stream-chat-shim/src/SearchSourceResults.tsx
'use client'
import React from 'react'

export type SearchSourceResultsProps = {
  /** Search source representing the query and state */
  searchSource: any
}

/** Placeholder implementation of the SearchSourceResults component. */
export const SearchSourceResults = (_props: SearchSourceResultsProps) => {
  return (
    <div data-testid="search-source-results-placeholder">
      SearchSourceResults placeholder
    </div>
  )
}

export default SearchSourceResults

