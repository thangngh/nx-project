import { render } from '@testing-library/react';

import NxProjectHook from './hook';

describe('NxProjectHook', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<NxProjectHook />);
    expect(baseElement).toBeTruthy();
  });
});
