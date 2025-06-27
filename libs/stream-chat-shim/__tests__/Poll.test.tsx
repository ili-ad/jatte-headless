import React from 'react';
import { render } from '@testing-library/react';
import { Poll } from '../src/components/Poll/Poll';

test('renders without crashing', () => {
  render(<Poll poll={{ id: '1' } as any} />);
});
