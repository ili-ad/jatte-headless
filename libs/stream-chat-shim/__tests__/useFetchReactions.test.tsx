import { renderHook } from '@testing-library/react'
import { useFetchReactions } from '../src/useFetchReactions'

describe('useFetchReactions', () => {
  test('returns default state and updates on fetch', async () => {
    const handleFetchReactions = jest.fn().mockResolvedValue([{ id: '1' }])
    const { result, waitForNextUpdate } = renderHook(() =>
      useFetchReactions({
        reactionType: 'like',
        shouldFetch: true,
        handleFetchReactions,
      })
    )
    expect(result.current.isLoading).toBe(true)
    await waitForNextUpdate()
    expect(handleFetchReactions).toHaveBeenCalledWith('like', undefined)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.reactions).toEqual([{ id: '1' }])
  })
})
