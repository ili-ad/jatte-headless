import React from 'react';
import { render } from '@testing-library/react';
import { PlayButton } from '../src/components/Attachment/components/PlayButton';

test('renders without crashing', () => {
  render(<PlayButton isPlaying={false} onClick={() => {}} />);
});
