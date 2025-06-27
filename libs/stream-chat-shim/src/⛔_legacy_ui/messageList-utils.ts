// libs/stream-chat-shim/src/messageList-utils.ts
// Minimal placeholder implementations for Stream's MessageList utilities.

import type { Dispatch, SetStateAction } from 'react'
import type { LocalMessage, MessageLabel, UserResponse } from 'chat-shim'

const CUSTOM_MESSAGE_TYPE = {
  intro: 'intro',
  date: 'date',
} as const

type IntroMessage = {
  customType: typeof CUSTOM_MESSAGE_TYPE.intro
  id: string
}

type DateSeparatorMessage = {
  customType: typeof CUSTOM_MESSAGE_TYPE.date
  date: Date
  id: string
  type?: MessageLabel
  unread: boolean
}

export type RenderedMessage = LocalMessage | DateSeparatorMessage | IntroMessage

type ProcessMessagesContext = {
  userId: string
  enableDateSeparator?: boolean
  hideDeletedMessages?: boolean
  hideNewMessageSeparator?: boolean
  lastRead?: Date | null
}

export type ProcessMessagesParams = ProcessMessagesContext & {
  messages: LocalMessage[]
  reviewProcessedMessage?: (params: {
    changes: RenderedMessage[]
    context: ProcessMessagesContext
    index: number
    messages: LocalMessage[]
    processedMessages: RenderedMessage[]
  }) => LocalMessage[]
  setGiphyPreviewMessage?: Dispatch<SetStateAction<LocalMessage | undefined>>
}

export const processMessages = (
  params: ProcessMessagesParams,
): RenderedMessage[] => {
  // TODO: implement real message processing logic
  return params.messages
}

// simple nanoid substitute – avoids extra deps
const nanoid = () => Math.random().toString(36).slice(2)

export const makeIntroMessage = (): IntroMessage => ({
  customType: CUSTOM_MESSAGE_TYPE.intro,
  id: nanoid(),
})

export const makeDateMessageId = (date?: string | Date) => {
  const suffix =
    date instanceof Date ? date.toISOString() : date ?? nanoid()
  return `${CUSTOM_MESSAGE_TYPE.date}-${suffix}`
}

export const getLastReceived = (
  messages: RenderedMessage[],
): string | null => {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i] as LocalMessage
    if (msg.status === 'received') return msg.id
  }
  return null
}

export const getReadStates = (
  _messages: LocalMessage[],
  _read: Record<string, { last_read: Date; user: UserResponse }> = {},
  _returnAllReadData: boolean,
) => {
  // Placeholder: return empty read data
  return {} as Record<string, UserResponse[]>
}

export const insertIntro = (
  messages: RenderedMessage[],
  _headerPosition?: number,
) => {
  // Simply return messages with intro prepended if empty
  if (messages.length === 0) return [makeIntroMessage()]
  return messages
}

export type GroupStyle = '' | 'middle' | 'top' | 'bottom' | 'single'

export const getGroupStyles = (
  _message: RenderedMessage,
  _previousMessage: RenderedMessage,
  _nextMessage: RenderedMessage,
  _noGroupByUser: boolean,
  _maxTimeBetweenGroupedMessages?: number,
): GroupStyle => ''

export const hasMoreMessagesProbably = (
  returnedCountMessages: number,
  limit: number,
) => returnedCountMessages >= limit

export const hasNotMoreMessages = (
  returnedCountMessages: number,
  limit: number,
) => returnedCountMessages < limit

export function isIntroMessage(message: unknown): message is IntroMessage {
  return (
    !!message &&
    typeof message === 'object' &&
    (message as IntroMessage).customType === CUSTOM_MESSAGE_TYPE.intro
  )
}

export function isDateSeparatorMessage(
  message: unknown,
): message is DateSeparatorMessage {
  return (
    !!message &&
    typeof message === 'object' &&
    (message as DateSeparatorMessage).customType === CUSTOM_MESSAGE_TYPE.date
  )
}

export function isLocalMessage(message: unknown): message is LocalMessage {
  return !isDateSeparatorMessage(message) && !isIntroMessage(message)
}

export const getIsFirstUnreadMessage = (
  _params: {
    isFirstMessage: boolean
    message: LocalMessage
    firstUnreadMessageId?: string
    lastReadDate?: Date
    lastReadMessageId?: string
    previousMessage?: RenderedMessage
    unreadMessageCount?: number
  },
) => false

export default {}
