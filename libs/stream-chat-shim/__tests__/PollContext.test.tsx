import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { PollProvider, usePollContext } from '../src/PollContext'

describe('PollContext shim', () => {
  it('renders children when poll is provided', () => {
    const html = renderToStaticMarkup(
      <PollProvider poll={{} as any}>child</PollProvider>
    )
    expect(html).toContain('child')
  })

  it('usePollContext returns provided poll', () => {
    const Test = () => {
      const { poll } = usePollContext()
      return <span>{poll ? 'ok' : 'no'}</span>
    }
    const html = renderToStaticMarkup(
      <PollProvider poll={{ id: '1' } as any}>
        <Test />
      </PollProvider>
    )
    expect(html).toContain('ok')
  })
})
