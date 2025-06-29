'use client'
import React from 'react'
import type { ComponentType } from 'react'
import type { Channel, MessageResponse, User } from 'chat-shim'

/** Placeholder implementation of the SearchResultItem component. */
export type SearchResultItemProps = Record<string, any>

export const SearchResultItem = (_props: SearchResultItemProps) => {
  return (
    <div data-testid="search-result-item-placeholder">SearchResultItem placeholder</div>
  )
}

export default SearchResultItem

export type ChannelSearchResultItemProps = {
  item: Channel
}

export const ChannelSearchResultItem = ({ item }: ChannelSearchResultItemProps) => (
  <div data-testid="search-result-channel">Channel: {item.id}</div>
)

export type ChannelByMessageSearchResultItemProps = {
  item: MessageResponse
}

export const MessageSearchResultItem = ({ item }: ChannelByMessageSearchResultItemProps) => (
  <div data-testid="search-result-message">Message: {item.id}</div>
)

export type UserSearchResultItemProps = {
  item: User
}

export const UserSearchResultItem = ({ item }: UserSearchResultItemProps) => (
  <div data-testid="search-result-user">{item.name ?? item.id}</div>
)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SearchResultItemComponents = Record<string, ComponentType<{ item: any }>>

export const DefaultSearchResultItems: SearchResultItemComponents = {
  channels: ChannelSearchResultItem,
  messages: MessageSearchResultItem,
  users: UserSearchResultItem,
}

