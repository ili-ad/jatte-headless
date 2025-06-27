import { render } from '@testing-library/react';
import { DialogPortalDestination, DialogPortalEntry } from '../src/components/Dialog/DialogPortal';
import React from 'react';

test('renders without crashing', () => {
  render(
    <>
      <DialogPortalDestination />
      <DialogPortalEntry dialogId="test" />
    </>,
  );
});
