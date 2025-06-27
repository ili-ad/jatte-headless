import React from 'react';
import { render } from '@testing-library/react';
import { ModalHeader } from '../src/components/Modal/ModalHeader';

test('renders without crashing', () => {
  render(<ModalHeader title='Test Title' />);
});
