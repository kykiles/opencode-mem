import type { PlatformAdapter } from '../types.js';
import { rawAdapter } from './raw.js';

export function getPlatformAdapter(_platform: string): PlatformAdapter {
  return rawAdapter;
}

export { rawAdapter };
