import { SearchController, ChannelSearchSource, SearchSourceType } from '../index';

describe('SearchController', () => {
  test('aggregates results from sources', async () => {
    class Src extends ChannelSearchSource {
      type = SearchSourceType.channel;
      query = jest.fn(async (q: string) => [q + '1']);
    }
    const a = new Src({});
    const b = new Src({});
    const ctrl = new SearchController({ sources: [a, b] });
    const res = await ctrl.query('x');
    expect(a.query).toHaveBeenCalledWith('x');
    expect(b.query).toHaveBeenCalledWith('x');
    expect(res).toEqual(['x1', 'x1']);
  });

  test('updates focusedMessage via state store', () => {
    const ctrl = new SearchController();
    ctrl._internalState.partialNext({ focusedMessage: 'msg' });
    expect(ctrl.state.getLatestValue().focusedMessage).toBe('msg');
  });
});
