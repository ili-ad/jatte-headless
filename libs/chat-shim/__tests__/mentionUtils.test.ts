import { getTriggerCharWithToken, insertItemWithTrigger, replaceWordWithEntity } from '../index';

describe('mention utilities', () => {
  test('getTriggerCharWithToken finds last token', () => {
    expect(getTriggerCharWithToken('hello @bar')).toBe('@bar');
    expect(getTriggerCharWithToken('/giphy fun')).toBe('/giphy');
    expect(getTriggerCharWithToken('nothing here')).toBe('');
  });

  test('insertItemWithTrigger replaces token', () => {
    expect(insertItemWithTrigger('hello @ba', 'bar')).toBe('hello @bar ');
  });

  test('replaceWordWithEntity swaps word', () => {
    expect(replaceWordWithEntity('hello @bar', '@bar', '<@bar>')).toBe('hello <@bar>');
  });
});
