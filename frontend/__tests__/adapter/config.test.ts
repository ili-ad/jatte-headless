import { expect, test } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';

/** Ensure config getter mirrors configState */
test('config reflects configState store', () => {
  const client = new ChatClient('u1', 'jwt-test');
  const channel = client.channel('messaging', 'room1');

  // default config
  expect(channel.messageComposer.config).toEqual({
    attachments: {
      acceptedFiles: [],
      maxNumberOfFilesPerMessage: 10,
    },
    text: { enabled: true },
    multipleUploads: true,
    isUploadEnabled: true,
  });

  // mutate store and expect getter to reflect change
  channel.messageComposer.configState._set({ text: { enabled: false } });
  expect(channel.messageComposer.config.text.enabled).toBe(false);
});
