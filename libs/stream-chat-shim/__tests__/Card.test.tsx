import React from 'react';
import { render } from '@testing-library/react';
import { Card } from '../src/components/Attachment/Card';

test('renders without crashing', () => {
  render(<Card />);
});
