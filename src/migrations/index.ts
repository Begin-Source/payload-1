import * as migration_20250929_111647 from './20250929_111647';
import * as migration_20260420_084024_mcp_plugin from './20260420_084024_mcp_plugin';
import * as migration_20260420_093625 from './20260420_093625';
import * as migration_20260420_093949 from './20260420_093949';
import * as migration_20260420_103719 from './20260420_103719';
import * as migration_20260420_151119 from './20260420_151119';
import * as migration_20260420_213352_phase_c_affiliate_globals from './20260420_213352_phase_c_affiliate_globals';

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
    name: '20260420_093949',
  },
  {
    up: migration_20260420_103719.up,
    down: migration_20260420_103719.down,
    name: '20260420_103719',
  },
  {
    up: migration_20260420_151119.up,
    down: migration_20260420_151119.down,
    name: '20260420_151119',
  },
  {
    up: migration_20260420_213352_phase_c_affiliate_globals.up,
    down: migration_20260420_213352_phase_c_affiliate_globals.down,
    name: '20260420_213352_phase_c_affiliate_globals',
  },
];
