import React from 'react';
import { render } from '@testing-library/react';
import {
  calculateItemIndex,
  calculateFirstItemIndex,
  Item,
  Header,
  EmptyPlaceholder,
  messageRenderer,
} from '../src/VirtualizedMessageListComponents';

describe('VirtualizedMessageListComponents shim', () => {
  test('index helpers use offset', () => {
    const idx = calculateItemIndex(5, 3);
    const first = calculateFirstItemIndex(3);
    expect(idx).toBe(5 + 3 - 10 ** 7);
    expect(first).toBe(10 ** 7 - 3);
  });

  test('Item renders a div', () => {
    const { container } = render(<Item data-item-index={0} />);
    expect(container.querySelector('div')).toBeTruthy();
  });

  test('messageRenderer returns element', () => {
    const el = messageRenderer(0, null, {} as any);
    const { getByTestId } = render(<>{el}</>);
    expect(getByTestId('virtualized-message')).toBeTruthy();
  });

  test('EmptyPlaceholder renders when no messages', () => {
    const { getByTestId } = render(<EmptyPlaceholder context={{}} />);
    expect(getByTestId('virtualized-message-list-empty')).toBeTruthy();
  });
});
