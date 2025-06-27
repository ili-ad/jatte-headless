import React from 'react';
import { render } from '@testing-library/react';
import { MessageActionsBox } from '../src/components/MessageActions/MessageActionsBox';

test('renders without crashing', () => {
  render(
    <MessageActionsBox
      getMessageActions={() => []}
      handleDelete={() => {}}
      handleEdit={() => {}}
      handleFlag={() => {}}
      handleMarkUnread={() => {}}
      handleMute={() => {}}
      handlePin={() => {}}
      isUserMuted={() => false}
      mine={false}
      open={false}
    />,
  );
});
