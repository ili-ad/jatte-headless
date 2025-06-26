import type { Nodes } from 'hast-util-find-and-replace/lib';
import type { UserResponse } from 'stream-chat';

/**
 * Placeholder for Stream's `mentionsMarkdownPlugin` rehype plugin.
 * Currently this shim performs no transformations.
 */
export const mentionsMarkdownPlugin = (
  _mentionedUsers: UserResponse[],
) =>
  () =>
  (_tree: Nodes): void => {
    // TODO: implement mention handling when ported
  };
