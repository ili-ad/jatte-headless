import React from 'react';
import { render } from '@testing-library/react';
import { MessageEditedTimestamp } from '../src/components/Message/MessageEditedTimestamp';

test('renders without crashing', () => {
  render(
    <MessageEditedTimestamp
      open={true}
      message={{ message_text_updated_at: new Date() } as any}
    />
  );
});
