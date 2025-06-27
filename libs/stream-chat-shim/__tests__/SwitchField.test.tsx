import React from 'react';
import { render } from '@testing-library/react';
import { SwitchField } from '../src/components/Form/SwitchField';

test('renders without crashing', () => {
  render(<SwitchField />);
});
