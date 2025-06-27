import type { CSSProperties, MutableRefObject } from 'react';
import React from 'react';
import type { Attachment } from 'chat-shim';

export type Dimensions = { height?: string; width?: string };

export type GalleryImageProps = {
  dimensions?: Dimensions;
  innerRef?: MutableRefObject<HTMLImageElement | null>;
  previewUrl?: string;
  style?: CSSProperties;
} & (
  | {
      fallback?: string;
      image_url?: string;
      thumb_url?: string;
    }
  | Attachment
);

/**
 * Placeholder component for Stream's Gallery Image.
 * Renders a simple <img> element using the provided URLs.
 */
export const GalleryImage = (props: GalleryImageProps) => {
  const {
    dimensions = {},
    fallback,
    image_url,
    innerRef,
    previewUrl,
    style,
    thumb_url,
  } = props;

  const src = previewUrl || image_url || thumb_url;

  return (
    <img
      alt={fallback}
      data-testid="gallery-image"
      src={src}
      style={style}
      title={fallback}
      {...dimensions}
      {...(innerRef && { ref: innerRef })}
    />
  );
};

export default GalleryImage;
