import React from 'react';
import { render } from '@testing-library/react';
import { AddCommentForm } from '../src/components/Poll/PollActions/AddCommentForm';

test('renders without crashing', () => {
  render(<AddCommentForm close={() => {}} messageId="1" />);
});
