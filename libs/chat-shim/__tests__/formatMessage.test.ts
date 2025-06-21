import { formatMessage } from '../index';

describe('formatMessage', () => {
  test('autolinks URLs and replaces emoji codes', () => {
    const input = 'See https://example.com :) :smile:';
    const output = formatMessage(input);
    expect(output).toContain('<a href="https://example.com"');
    expect(output).toContain('😄');
  });
});
