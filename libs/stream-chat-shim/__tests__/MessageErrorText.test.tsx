import React from 'react';
import { render } from '@testing-library/react';
import { MessageErrorText } from '../src/components/Message/MessageErrorText';

test('renders without crashing', () => {
  render(
    <MessageErrorText message={{} as any} theme="light" />,
  );
});
