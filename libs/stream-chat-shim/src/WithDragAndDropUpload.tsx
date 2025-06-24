import React, { PropsWithChildren } from 'react';
import type { MessageComposerConfig } from 'stream-chat';

/**
 * Props for the {@link WithDragAndDropUpload} component.
 * This shim only renders its children and does not provide
 * any actual drag and drop functionality yet.
 */
export type WithDragAndDropUploadProps = PropsWithChildren<{
  /** Optional callback when files are dropped. */
  onDrop?: (files: File[]) => void;
  /** Optional composer configuration. */
  messageComposerConfig?: MessageComposerConfig;
}>;

/**
 * Placeholder implementation of Stream Chat's WithDragAndDropUpload component.
 */
export const WithDragAndDropUpload = (
  props: WithDragAndDropUploadProps,
) => {
  const { children } = props;
  return (
    <div data-testid="with-drag-and-drop-upload-placeholder">{children}</div>
  );
};

export default WithDragAndDropUpload;
