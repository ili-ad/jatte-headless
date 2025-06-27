import React from 'react';
import { render } from '@testing-library/react';
import { DragAndDropContainer } from '../src/components/DragAndDrop/DragAndDropContainer';

test('renders without crashing', () => {
  render(<DragAndDropContainer>child</DragAndDropContainer>);
});
