'use client'
import { Component, ReactNode } from 'react'
import ChatGuard from '@/components/ChatGuard'
import { AuthError } from './errors'

interface Props { children: ReactNode }
interface State { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    const { error } = this.state
    if (error) {
      if (error instanceof AuthError) {
        return <ChatGuard>{null}</ChatGuard>
      }
      return <div>Something went wrong</div>
    }
    return this.props.children
  }
}
