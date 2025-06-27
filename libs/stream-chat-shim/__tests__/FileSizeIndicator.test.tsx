import React from 'react';
import { render } from '@testing-library/react';
import { FileSizeIndicator } from '../src/components/Attachment/components/FileSizeIndicator';

test('renders without crashing', () => {
  const { getByTestId } = render(<FileSizeIndicator fileSize={1024} />);
  expect(getByTestId('file-size-indicator')).toBeTruthy();
});
