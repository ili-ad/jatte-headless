import React from 'react';
import { render } from '@testing-library/react';
import { ButtonWithSubmenu } from '../src/components/Dialog/ButtonWithSubmenu';

const Submenu = () => <div>submenu</div>;

test('renders without crashing', () => {
  render(
    <ButtonWithSubmenu placement="bottom" Submenu={Submenu}>
      label
    </ButtonWithSubmenu>
  );
});
