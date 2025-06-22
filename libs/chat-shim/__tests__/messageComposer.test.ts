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

  test('attachment manager adds files', async () => {
    const mc = new MessageComposer();
    const file = new File(['x'], 'a.txt', { type: 'text/plain' });
    await mc.attachmentManager.addFiles([file]);
    const list = mc.attachmentManager.state.getLatestValue().attachments;
    expect(list.length).toBe(1);
  });

  test('link previews manager stores fetched previews', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ url: 'http://x', title: 'X' }),
    }) as any;
    const mc = new MessageComposer();
    await mc.linkPreviewsManager.add('http://x');
    const map = mc.linkPreviewsManager.state.getLatestValue().previews;
    expect(map.get('http://x')).toEqual({ url: 'http://x', title: 'X' });
  });
});
