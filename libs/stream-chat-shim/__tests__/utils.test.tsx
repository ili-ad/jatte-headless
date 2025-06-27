import { displayDuration } from '../src/components/Attachment/utils';

describe('components/Attachment/utils', () => {
  it('formats time', () => {
    expect(displayDuration(70)).toBe('01:10');
  });
});
