import { render } from '@testing-library/react';

import NxProjectUi from './ui';

describe('NxProjectUi', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<NxProjectUi />);
    expect(baseElement).toBeTruthy();
  });
});
