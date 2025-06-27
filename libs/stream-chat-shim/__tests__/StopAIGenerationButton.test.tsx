import React from 'react'
import { render } from '@testing-library/react'
import { StopAIGenerationButton } from '../src/components/MessageInput/StopAIGenerationButton'

test('renders placeholder', () => {
  const { getByTestId } = render(<StopAIGenerationButton />)
  expect(getByTestId('stop-ai-generation-button')).toBeTruthy()
})
