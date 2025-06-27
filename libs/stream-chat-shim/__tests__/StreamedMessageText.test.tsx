import React from 'react';
import { render } from '@testing-library/react';
import { StreamedMessageText } from '../src/components/Message/StreamedMessageText';

test('renders without crashing', () => {
  render(<StreamedMessageText message={{ text: 'hello' }} />);
});
