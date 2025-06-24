import React from 'react';
import { render } from '@testing-library/react';
import { Mention } from '../src/Mention';

describe('Mention component', () => {
  it('renders user mention span', () => {
    const { getByText } = render(
      <Mention node={{ mentionedUser: { id: 'bob' } as any }}>
        @bob
      </Mention>
    );
    const span = getByText('@bob');
    expect(span.getAttribute('data-user-id')).toBe('bob');
    expect(span.className).toContain('str-chat__message-mention');
  });
});
