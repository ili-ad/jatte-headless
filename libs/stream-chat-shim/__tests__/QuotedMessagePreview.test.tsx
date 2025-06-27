import React from 'react';
import { render } from '@testing-library/react';
import { QuotedMessagePreview } from '../src/components/MessageInput/QuotedMessagePreview';

const quotedMessage: any = { text: 'Hi', user: { id: '1' } };

test('renders without crashing', () => {
  render(<QuotedMessagePreview quotedMessage={quotedMessage} />);
});
