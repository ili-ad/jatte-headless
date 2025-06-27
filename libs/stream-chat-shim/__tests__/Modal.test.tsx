import React from 'react';
import { render } from '@testing-library/react';
import { Modal } from '../src/components/Modal/Modal';

test('renders without crashing', () => {
  render(<Modal open={false} />);
});
