import React from 'react'
import { render } from '@testing-library/react'
import { ChannelSearchResultItem } from '../src/SearchResultItem'
import type { Channel } from 'stream-chat'

test('renders placeholder', () => {
  const channel = { id: '123', type: 'messaging' } as unknown as Channel
  const { getByTestId } = render(<ChannelSearchResultItem item={channel} />)
  expect(getByTestId('search-result-channel')).toBeTruthy()
})
