import React from 'react';
import { render } from '@testing-library/react';
import { EventComponent } from '../src/components/EventComponent/EventComponent';

test('renders without crashing', () => {
  render(<EventComponent message={{} as any} />);
});
