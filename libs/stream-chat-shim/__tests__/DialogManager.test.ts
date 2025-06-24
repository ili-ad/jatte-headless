import { DialogManager } from '../src/DialogManager';

describe('DialogManager shim', () => {
  it('throws when open is called', () => {
    const dm = new DialogManager();
    expect(() => dm.open({ id: 'test' })).toThrow('DialogManager.open not implemented');
  });
});
