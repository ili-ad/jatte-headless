import { generateMessageDraft } from '../src/messageDraft';

test('generates a message draft with defaults', () => {
  const draft = generateMessageDraft({ channel_cid: 'test:1' });
  expect(draft.channel_cid).toBe('test:1');
  expect(draft.message).toBeTruthy();
  expect(draft.created_at).toBeDefined();
});
