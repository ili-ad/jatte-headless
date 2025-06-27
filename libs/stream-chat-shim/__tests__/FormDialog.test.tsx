import React from 'react';
import { render } from '@testing-library/react';
import { FormDialog } from '../src/components/Dialog/FormDialog';

test('renders without crashing', () => {
  render(<FormDialog close={() => {}} fields={{}} onSubmit={async () => {}} />);
});
