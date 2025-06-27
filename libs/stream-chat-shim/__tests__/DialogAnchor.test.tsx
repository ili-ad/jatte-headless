import React from 'react';
import { render } from '@testing-library/react';
import { DialogAnchor } from '../src/Dialog/DialogAnchor';

test('renders without crashing', () => {
  render(
    <DialogAnchor id="dialog" open={true} placement="auto" referenceElement={null}>
      content
    </DialogAnchor>
  );
});
