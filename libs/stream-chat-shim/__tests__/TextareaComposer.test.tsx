import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { TextareaComposer } from '../src/TextareaComposer';

test('renders textarea and updates textComposer', () => {
  const controller = { state: { text: 'hi' }, setText: jest.fn() };
  const { getByTestId } = render(<TextareaComposer textComposer={controller} />);
  const textarea = getByTestId('textarea-composer') as HTMLTextAreaElement;
  expect(textarea.value).toBe('hi');
  fireEvent.change(textarea, { target: { value: 'bye' } });
  expect(controller.setText).toHaveBeenCalledWith('bye');
});
