import React from 'react';
import { render } from '@testing-library/react';
import { DownloadIcon } from '../src/components/Attachment/icons';

test('renders without crashing', () => {
  render(<DownloadIcon className="" />);
});
