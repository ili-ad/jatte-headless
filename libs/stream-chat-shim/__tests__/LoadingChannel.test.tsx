import React from 'react';
import { render } from '@testing-library/react';
import { LoadingChannel } from '../src/components/Channel/LoadingChannel';

test('renders without crashing', () => {
  render(<LoadingChannel />);
});
