import React from 'react';
import { render } from '@testing-library/react';
import { PollOptionSelector } from '../src/components/Poll/PollOptionSelector';

test('renders without crashing', () => {
  render(<PollOptionSelector option={{ id: '1', poll_id: '', text: '' }} />);
});
