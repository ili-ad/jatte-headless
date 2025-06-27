import React from 'react'
import { CloseIcon } from './icons'

export type StopAIGenerationButtonProps = React.ComponentProps<'button'>

/**
 * Placeholder implementation of the StopAIGenerationButton component.
 */
export const StopAIGenerationButton = ({ children, ...rest }: StopAIGenerationButtonProps) => (
  <button
    aria-label='Stop AI generation'
    className='str-chat__stop-ai-generation-button'
    data-testid='stop-ai-generation-button'
    type='button'
    {...rest}
  >
    {children || <CloseIcon />}
  </button>
)

export default StopAIGenerationButton
