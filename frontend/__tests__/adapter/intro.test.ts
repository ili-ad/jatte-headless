import { expect, test } from 'vitest';
import { makeIntroMessage, isIntroMessage, CUSTOM_MESSAGE_TYPE } from '../../src/lib/stream-adapter';

test('makeIntroMessage returns intro message', () => {
  const msg = makeIntroMessage();
  expect(msg.customType).toBe(CUSTOM_MESSAGE_TYPE.intro);
  expect(typeof msg.id).toBe('string');
});

test('isIntroMessage detects intro messages', () => {
  const msg = makeIntroMessage();
  expect(isIntroMessage(msg)).toBe(true);
  expect(isIntroMessage({})).toBe(false);
});

