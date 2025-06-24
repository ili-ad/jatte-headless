export type ChannelStateReducerAction = any;

export const makeChannelReducer = () =>
  (state: any, _action: ChannelStateReducerAction) => state;

export const initialState = {
  error: null,
  hasMore: true,
  hasMoreNewer: false,
  loading: true,
  loadingMore: false,
  members: {},
  messages: [],
  pinnedMessages: [],
  read: {},
  suppressAutoscroll: false,
  thread: null,
  threadHasMore: true,
  threadLoadingMore: false,
  threadMessages: [],
  threadSuppressAutoscroll: false,
  typing: {},
  watcherCount: 0,
  watchers: {},
};
