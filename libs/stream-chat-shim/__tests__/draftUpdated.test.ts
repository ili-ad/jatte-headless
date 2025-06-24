import { draftUpdated } from '../src/draftUpdated';

describe('draftUpdated builder', () => {
  it('creates a draft.updated event object', () => {
    const event = draftUpdated();
    expect(event.type).toBe('draft.updated');
  });
});
