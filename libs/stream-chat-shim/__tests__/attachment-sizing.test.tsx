import { getImageAttachmentConfiguration, getVideoAttachmentConfiguration } from '../src/components/Attachment/attachment-sizing';

test('attachment sizing helpers execute', () => {
  const el = document.createElement('div');
  const img = getImageAttachmentConfiguration({} as any, el);
  const vid = getVideoAttachmentConfiguration({} as any, el, false);
  expect(img).toBeTruthy();
  expect(vid).toBeTruthy();
});
