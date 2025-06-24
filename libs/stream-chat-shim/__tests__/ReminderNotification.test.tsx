import React from 'react';
import { render } from '@testing-library/react';
import { ReminderNotification } from '../src/ReminderNotification';

test('renders placeholder', () => {
  const { getByTestId } = render(<ReminderNotification />);
  expect(getByTestId('reminder-notification-placeholder')).toBeTruthy();
});
