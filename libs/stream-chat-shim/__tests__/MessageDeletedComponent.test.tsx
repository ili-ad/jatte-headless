import React from 'react';
import { render } from '@testing-library/react';
import { MessageDeleted } from '../src/components/Message/MessageDeleted';

test('renders without crashing', () => {
  render(<MessageDeleted message={{ id: '1', type: 'deleted' } as any} />);
});
