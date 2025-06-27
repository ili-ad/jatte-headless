import React from 'react';
import { render } from '@testing-library/react';
import { RemindMeSubmenu } from '../src/components/MessageActions/RemindMeSubmenu';

test('renders without crashing', () => {
  render(<RemindMeSubmenu />);
});
