import { render } from '@testing-library/react';
import React from 'react';
import { FileIcon } from '../src/components/ReactFileUtilities/FileIcon';

describe('FileIcon', () => {
  test('renders without crashing', () => {
    render(<FileIcon />);
  });
});
