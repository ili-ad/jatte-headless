import React from 'react';
import { render } from '@testing-library/react';
import { PlayButton } from '../src/components/Attachment/components/PlayButton';

test('renders play button', () => {
  const { getByTestId } = render(
    <PlayButton isPlaying={false} onClick={() => {}} />
  );
  expect(getByTestId('play-audio')).toBeTruthy();
});
