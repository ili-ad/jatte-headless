import { render } from '@testing-library/react';
import React from 'react';
import { UploadButton } from '../src/components/ReactFileUtilities/UploadButton';

describe('ReactFileUtilities UploadButton', () => {
  test('renders without crashing', () => {
    render(<UploadButton onFileChange={() => {}} />);
  });
});
