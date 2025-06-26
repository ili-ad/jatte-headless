import React from 'react';
import ReactMarkdown, { Options } from 'react-markdown';
import type { PluggableList } from 'react-markdown/lib/react-markdown';
import type { UserResponse } from 'stream-chat';

export type RenderTextPluginConfigurator = (
  defaultPlugins: PluggableList,
) => PluggableList;

export const defaultAllowedTagNames: Array<keyof JSX.IntrinsicElements | 'emoji' | 'mention'> = [
  'p',
  'strong',
  'em',
  'a',
  'code',
  'pre',
];

export type RenderTextOptions<StreamChatGenerics = unknown> = {
  allowedTagNames?: Array<
    keyof JSX.IntrinsicElements | 'emoji' | 'mention' | (string & {})
  >;
  customMarkDownRenderers?: Options['components'];
  getRehypePlugins?: RenderTextPluginConfigurator;
  getRemarkPlugins?: RenderTextPluginConfigurator;
};

/**
 * Minimal placeholder implementation of renderText.
 * Renders markdown using react-markdown without advanced plugins.
 */
export const renderText = <StreamChatGenerics,>(
  text?: string,
  _mentionedUsers?: UserResponse<StreamChatGenerics>[],
  _options: RenderTextOptions = {},
) => {
  if (!text) return null;
  return <ReactMarkdown skipHtml>{text}</ReactMarkdown>;
};

export default renderText;
