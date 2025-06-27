import React from 'react';
import { render } from '@testing-library/react';
import { WaveProgressBar } from '../src/components/Attachment/components/WaveProgressBar';

it('renders without crashing', () => {
  render(<WaveProgressBar seek={() => {}} waveformData={[]} />);
});
