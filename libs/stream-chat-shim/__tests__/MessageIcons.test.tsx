import React from 'react';
import { render } from '@testing-library/react';
import {
  ActionsIcon,
  ReactionIcon,
  ThreadIcon,
  PinIcon,
  PinIndicator,
  MessageDeliveredIcon,
  MessageErrorIcon,
} from '../src/components/Message/icons';

test('renders message icons without crashing', () => {
  render(
    <>
      <ActionsIcon />
      <ReactionIcon />
      <ThreadIcon />
      <PinIcon />
      <PinIndicator message={{ id: '1' } as any} t={(str) => str} />
      <MessageDeliveredIcon />
      <MessageErrorIcon />
    </>
  );
});
