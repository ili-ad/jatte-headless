import React from 'react';
import type { Attachment } from 'chat-shim';

export type ModalGalleryProps = {
  /** The images for the Carousel component */
  images: Attachment[];
  /** The index for the component */
  index?: number;
};

/** Placeholder implementation of ModalGallery used during migration. */
export const ModalGallery = (_props: ModalGalleryProps) => {
  return <div data-testid="modal-gallery-placeholder">ModalGallery placeholder</div>;
};

export default ModalGallery;
