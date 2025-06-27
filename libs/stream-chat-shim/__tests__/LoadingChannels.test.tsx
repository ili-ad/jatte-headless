import React from 'react';
import { render } from '@testing-library/react';
import { LoadingChannels } from '../src/components/Loading/LoadingChannels';

test('renders without crashing', () => {
  render(<LoadingChannels />);
});
