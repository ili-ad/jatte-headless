import React from 'react'
import { render } from '@testing-library/react'
import { AttachmentPreviewList } from '../src/AttachmentPreviewList'

test('renders placeholder', () => {
  const { getByTestId } = render(<AttachmentPreviewList />)
  expect(getByTestId('attachment-preview-list')).toBeTruthy()
})
