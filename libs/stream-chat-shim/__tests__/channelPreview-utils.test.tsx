import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { renderPreviewText, getGroupChannelDisplayInfo } from '../src/channelPreview-utils';

describe('channelPreview-utils', () => {
  test('renderPreviewText renders markdown', () => {
    const html = renderToStaticMarkup(renderPreviewText('**hi**'));
    expect(html).toContain('strong');
  });

  test('getGroupChannelDisplayInfo handles groups', () => {
    const channel: any = {
      state: {
        members: {
          a: { user: { name: 'A', image: 'a.png' } },
          b: { user: { name: 'B', image: 'b.png' } },
          c: { user: { name: 'C', image: 'c.png' } },
        },
      },
    };
    const info = getGroupChannelDisplayInfo(channel);
    expect(info?.length).toBe(3);
    expect(info?.[0].name).toBe('A');
  });
});
