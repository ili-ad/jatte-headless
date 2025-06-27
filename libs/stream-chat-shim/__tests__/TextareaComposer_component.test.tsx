import React from 'react';
import { render } from '@testing-library/react';
import { TextareaComposer } from '../src/components/TextareaComposer/TextareaComposer';

test('renders without crashing', () => {
  render(<TextareaComposer />);
});
