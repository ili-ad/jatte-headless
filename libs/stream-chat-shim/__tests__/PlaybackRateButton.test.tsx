import React from 'react';
import { render } from '@testing-library/react';
import { PlaybackRateButton } from '../src/components/Attachment/components/PlaybackRateButton';

test('renders without crashing', () => {
  render(<PlaybackRateButton />);
});
