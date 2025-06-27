import type { PropsWithChildren } from 'react';
import React from 'react';
import type { Attachment } from 'chat-shim';

export type AttachmentComponentType = string;

export type GalleryAttachment = {
  images: Attachment[];
  type: 'gallery';
};

export type RenderAttachmentProps = {
  attachment: Attachment;
  [key: string]: any;
};

export type RenderGalleryProps = {
  attachment: GalleryAttachment;
  [key: string]: any;
};

export type AttachmentContainerProps = {
  attachment: Attachment | GalleryAttachment;
  componentType: AttachmentComponentType;
};

export const AttachmentWithinContainer = (
  _props: PropsWithChildren<AttachmentContainerProps>,
): React.JSX.Element => {
  return <div>{_props.children}</div>;
};

export const AttachmentActionsContainer = (
  _props: RenderAttachmentProps,
): React.JSX.Element | null => {
  return null;
};

export const GalleryContainer = (
  _props: RenderGalleryProps,
): React.JSX.Element => {
  return <div />;
};

export const ImageContainer = (_props: RenderAttachmentProps): React.JSX.Element => {
  return <div />;
};

export const CardContainer = (_props: RenderAttachmentProps): React.JSX.Element => {
  return <div />;
};

export const FileContainer = (
  _props: RenderAttachmentProps,
): React.JSX.Element | null => {
  return null;
};

export const AudioContainer = (_props: RenderAttachmentProps): React.JSX.Element => {
  return <div />;
};

export const VoiceRecordingContainer = (
  _props: RenderAttachmentProps,
): React.JSX.Element => {
  return <div />;
};

export const MediaContainer = (_props: RenderAttachmentProps): React.JSX.Element => {
  return <div />;
};

export const UnsupportedAttachmentContainer = (
  _props: RenderAttachmentProps,
): React.JSX.Element => {
  return <div />;
};
