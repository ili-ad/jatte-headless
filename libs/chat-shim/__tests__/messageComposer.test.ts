import { MessageComposer } from '../index';

describe('MessageComposer', () => {
  test('basic state transitions', () => {
    const comp = new MessageComposer();
    expect(comp.state).toEqual({ text: '', attachments: [] });

    comp.setText('hello');
    expect(comp.state.text).toBe('hello');

    comp.addAttachment({ id: 1 });
    expect(comp.state.attachments).toEqual([{ id: 1 }]);

    comp.reset();
    expect(comp.state).toEqual({ text: '', attachments: [] });
  });
});
