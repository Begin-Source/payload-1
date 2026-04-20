import * as migration_20250929_111647 from './20250929_111647';
import * as migration_20260420_084024_mcp_plugin from './20260420_084024_mcp_plugin';
import * as migration_20260420_093625 from './20260420_093625';
import * as migration_20260420_093949 from './20260420_093949';

export const migrations = [
  {
    up: migration_20250929_111647.up,
    down: migration_20250929_111647.down,
    name: '20250929_111647',
  },
  {
    up: migration_20260420_084024_mcp_plugin.up,
    down: migration_20260420_084024_mcp_plugin.down,
    name: '20260420_084024_mcp_plugin',
  },
  {
    up: migration_20260420_093625.up,
    down: migration_20260420_093625.down,
    name: '20260420_093625',
  },
  {
    up: migration_20260420_093949.up,
    down: migration_20260420_093949.down,
    name: '20260420_093949'
  },
];
