import { expect, test } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';

test('configState exposes default composer config', () => {
  const client = new ChatClient('u1', 'jwt1');
  const channel = client.channel('messaging', 'room1');

  const cfg = channel.messageComposer.configState.getSnapshot();

  expect(cfg).toEqual({
    attachments: { acceptedFiles: [], maxNumberOfFilesPerMessage: 10 },
    text: { enabled: true },
    multipleUploads: true,
    isUploadEnabled: true,
  });
});
