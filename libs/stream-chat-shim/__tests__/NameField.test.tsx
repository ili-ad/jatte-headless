import React from 'react';
import { render } from '@testing-library/react';
import { NameField } from '../src/NameField';

describe('NameField component', () => {
  it('renders placeholder', () => {
    const { getByTestId } = render(<NameField />);
    expect(getByTestId('name-field-placeholder')).toBeTruthy();
  });
});
