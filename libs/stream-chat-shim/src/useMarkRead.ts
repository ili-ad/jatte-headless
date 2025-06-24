import { useEffect } from 'react'

export type UseMarkReadParams = {
  isMessageListScrolledToBottom: boolean
  messageListIsThread: boolean
  wasMarkedUnread?: boolean
}

/**
 * Placeholder implementation of Stream's `useMarkRead` hook.
 * Logs a warning whenever the provided parameters change.
 */
export const useMarkRead = (_params: UseMarkReadParams): void => {
  useEffect(() => {
    console.warn('useMarkRead not implemented')
  }, [
    _params.isMessageListScrolledToBottom,
    _params.messageListIsThread,
    _params.wasMarkedUnread,
  ])
}

export default useMarkRead
