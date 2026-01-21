import '@testing-library/jest-dom/vitest';
import * as matchers from 'vitest-axe/matchers';
import { expect } from 'vitest';

// Extend Vitest's expect with axe-core accessibility matchers
expect.extend(matchers);
