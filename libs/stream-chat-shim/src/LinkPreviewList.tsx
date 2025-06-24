import React from 'react';

export enum LinkPreviewState {
  DISMISSED = 'dismissed',
  FAILED = 'failed',
  LOADED = 'loaded',
  LOADING = 'loading',
  QUEUED = 'queued',
}

export type LinkPreview = {
  og_scrape_url?: string;
  title?: string;
  text?: string;
  state?: LinkPreviewState;
  [key: string]: any;
};

export type LinkPreviewListProps = {
  linkPreviews: LinkPreview[];
};

/**
 * Minimal placeholder for Stream's LinkPreviewList component.
 * Displays loaded link previews in a simple list.
 */
export const LinkPreviewList = ({ linkPreviews }: LinkPreviewListProps) => {
  if (!linkPreviews || linkPreviews.length === 0) return null;
  return (
    <div data-testid="link-preview-list">
      {linkPreviews.map((preview) =>
        preview.state === LinkPreviewState.LOADED ? (
          <div key={preview.og_scrape_url} data-testid="link-preview-card">
            <a href={preview.og_scrape_url}>{preview.title || preview.og_scrape_url}</a>
            {preview.text && <p>{preview.text}</p>}
          </div>
        ) : null
      )}
    </div>
  );
};

export default LinkPreviewList;
