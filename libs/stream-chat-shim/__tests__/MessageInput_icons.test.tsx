import React from 'react';
import { render } from '@testing-library/react';
import {
  LoadingIndicatorIcon,
  UploadIcon,
  CloseIcon,
  RetryIcon,
  DownloadIcon,
  LinkIcon,
  SendIcon,
  MicIcon,
  BinIcon,
  PauseIcon,
  PlayIcon,
  CheckSignIcon,
} from '../src/components/MessageInput/icons';

test('renders message input icons without crashing', () => {
  render(
    <>
      <LoadingIndicatorIcon />
      <UploadIcon />
      <CloseIcon />
      <RetryIcon />
      <DownloadIcon />
      <LinkIcon />
      <SendIcon />
      <MicIcon />
      <BinIcon />
      <PauseIcon />
      <PlayIcon />
      <CheckSignIcon />
    </>,
  );
});
