import React from 'react'
import { render } from '@testing-library/react'
import { AttachmentPreviewList } from '../src/components/MessageInput/AttachmentPreviewList'

test('renders without crashing', () => {
  render(<AttachmentPreviewList />)
})
