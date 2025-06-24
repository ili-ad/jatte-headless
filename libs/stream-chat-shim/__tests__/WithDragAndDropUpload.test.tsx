import React from 'react';
import { render } from '@testing-library/react';
import { WithDragAndDropUpload } from '../src/WithDragAndDropUpload';

test('renders children', () => {
  const { getByTestId } = render(
    <WithDragAndDropUpload>child</WithDragAndDropUpload>,
  );
  const el = getByTestId('with-drag-and-drop-upload-placeholder');
  expect(el).toHaveTextContent('child');
});
