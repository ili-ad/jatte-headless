import { MessageComposer } from '../index';

describe('MessageComposer', () => {
  test('set text, add attachment and reset', () => {
    const mc = new MessageComposer();
    mc.setText('hello');
    mc.addAttachment({ id: 'a1' });
    expect(mc.state.text).toBe('hello');
    expect(mc.state.attachments).toEqual([{ id: 'a1' }]);
    mc.reset();
    expect(mc.state.text).toBe('');
    expect(mc.state.attachments).toEqual([]);
  });
});
