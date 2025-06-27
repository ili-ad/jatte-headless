import React from 'react';
import { render } from '@testing-library/react';
import { PollAction } from '../src/components/Poll/PollActions/PollAction';

test('renders without crashing', () => {
  render(
    <PollAction
      buttonText='Button'
      closeModal={() => {}}
      modalIsOpen={false}
      openModal={() => {}}
    />
  );
});
