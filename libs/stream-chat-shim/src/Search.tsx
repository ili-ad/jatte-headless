// libs/stream-chat-shim/src/Search.tsx
'use client'

import React from 'react'

/** Placeholder implementation of the Search component.
 *  It renders a minimal placeholder element.
 */
export type SearchProps = Record<string, unknown>

export const Search = (_props: SearchProps) => {
  return <div data-testid="search-placeholder">Search placeholder</div>
}

export default Search
