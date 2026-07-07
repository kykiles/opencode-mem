import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

export interface IDEInfo {
  id: string;
  label: string;
  detected: boolean;
  hint?: string;
}

export function detectInstalledIDEs(): IDEInfo[] {
  const home = homedir();

  return [
    {
      id: 'opencode',
      label: 'OpenCode',
      detected: existsSync(join(home, '.config', 'opencode')),
      hint: 'plugin-based integration',
    },
  ];
}
