import { renderHook } from '@testing-library/react';
import { useMuteHandler } from '../src/useMuteHandler';

describe('useMuteHandler', () => {
  it('returns a handler that throws', async () => {
    const { result } = renderHook(() => useMuteHandler());
    await expect(result.current({ preventDefault() {} } as any)).rejects.toThrow(
      'useMuteHandler not implemented',
    );
  });
});
