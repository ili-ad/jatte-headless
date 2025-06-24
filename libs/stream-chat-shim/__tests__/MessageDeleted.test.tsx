import React from 'react';
import { render } from '@testing-library/react';
import { MessageDeleted } from '../src/MessageDeleted';

test('renders placeholder', () => {
  const { getByTestId } = render(<MessageDeleted message={{ id: '1' }} />);
  expect(getByTestId('message-deleted-component')).toBeTruthy();
});
