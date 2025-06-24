import React from 'react';
import { render } from '@testing-library/react';
import { Window } from '../src/Window';

test('renders children', () => {
  const { getByTestId } = render(
    <Window>
      <span data-testid="child" />
    </Window>
  );
  expect(getByTestId('child')).toBeTruthy();
});
