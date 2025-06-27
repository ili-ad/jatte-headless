import React from 'react';
import { render } from '@testing-library/react';

import { ThreadHead } from '../src/components/Thread/ThreadHead';

 test('renders without crashing', () => {
  render(<ThreadHead />);
});
