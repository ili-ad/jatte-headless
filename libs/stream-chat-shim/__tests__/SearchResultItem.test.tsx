import React from 'react'
import { render } from '@testing-library/react'
import { ChannelSearchResultItem } from '../src/SearchResultItem'
import type { Channel } from 'stream-chat'
import { SearchResultItem } from '../src/SearchResultItem'



  

test('renders placeholder', () => {
  const channel = { id: '123', type: 'messaging' } as unknown as Channel
  expect(getByTestId('search-result-item-placeholder')).toBeTruthy()
    const { getByTestId } = render(<ChannelSearchResultItem item={channel} />)  
    const { getByTestId } = render(<SearchResultItem />)
  expect(getByTestId('search-result-channel')).toBeTruthy()
})
