import React from 'react';
import { render } from '@testing-library/react';
import { PlaybackRateButton } from '../src/components/Attachment/components/PlaybackRateButton';

test('renders playback rate button', () => {
  const { getByTestId } = render(<PlaybackRateButton>1x</PlaybackRateButton>);
  expect(getByTestId('playback-rate-button')).toBeTruthy();
});
