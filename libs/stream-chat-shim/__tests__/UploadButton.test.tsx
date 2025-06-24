import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { UploadButton } from '../src/UploadButton';

test('calls onFileChange when files selected', () => {
  const handler = jest.fn();
  const { getByTestId } = render(
    <UploadButton data-testid="upload" onFileChange={handler} />,
  );
  const input = getByTestId('upload') as HTMLInputElement;
  const file = new File(['x'], 'test.txt');
  Object.defineProperty(input, 'files', { value: [file] });
  fireEvent.change(input);
  expect(handler).toHaveBeenCalledWith([file]);
});
