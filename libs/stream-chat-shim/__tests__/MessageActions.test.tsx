import React from 'react';
import { render } from '@testing-library/react';
import { MessageActions } from '../src/components/MessageActions/MessageActions';

test('renders without crashing', () => {
  render(
    <MessageActions message={{ id: '1' }} getMessageActions={() => []} />
  );
});
