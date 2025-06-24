import React from 'react';
import { render } from '@testing-library/react';
import { FixedHeightMessage } from '../src/FixedHeightMessage';

describe('FixedHeightMessage component', () => {
  it('renders message text when provided', () => {
    const { getByTestId } = render(
      <FixedHeightMessage message={{ id: '1', text: 'hello' } as any} />,
    );
    expect(getByTestId('fixed-height-message').textContent).toContain('hello');
  });
});
