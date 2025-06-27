import type { CSSProperties, MutableRefObject } from 'react';
import React from 'react';
import type { Attachment } from 'chat-shim';

export type GalleryProps = {
  images: ((
    | {
        image_url?: string | undefined;
        thumb_url?: string | undefined;
      }
    | Attachment
  ) & { previewUrl?: string; style?: CSSProperties })[];
  innerRefs?: MutableRefObject<(HTMLElement | null)[]>;
};

/**
 * Placeholder Gallery component used while the real implementation is ported.
 */
export const Gallery = (_props: GalleryProps) => (
  <div data-testid="gallery-placeholder">Gallery placeholder</div>
);

export default Gallery;
