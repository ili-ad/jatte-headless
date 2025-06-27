import { FilePdfIcon } from '../src/components/ReactFileUtilities/FileIcon/FileIconSet';
import { render } from '@testing-library/react';
import React from 'react';

test('renders FilePdfIcon without crashing', () => {
  render(<FilePdfIcon />);
});
