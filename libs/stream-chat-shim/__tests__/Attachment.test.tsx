import { Attachment } from '../src/Attachment';

describe('Attachment shim', () => {
  it('throws when used', () => {
    expect(() => Attachment({ attachments: [] })).toThrow('Attachment shim not implemented');
  });
});
