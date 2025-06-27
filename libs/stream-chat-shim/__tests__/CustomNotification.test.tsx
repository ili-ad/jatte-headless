import React from 'react';
import { render } from '@testing-library/react';
import { CustomNotification } from '../src/components/MessageList/CustomNotification';

test('renders without crashing', () => {
  render(
    <CustomNotification active type="info" />
  );
});
