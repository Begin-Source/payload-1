import * as migration_20250929_111647 from './20250929_111647';
import * as migration_20260420_084024_mcp_plugin from './20260420_084024_mcp_plugin';
import * as migration_20260420_093625 from './20260420_093625';
import * as migration_20260420_093949 from './20260420_093949';
import * as migration_20260420_103719 from './20260420_103719';
import * as migration_20260420_151119 from './20260420_151119';
import * as migration_20260420_213352_phase_c_affiliate_globals from './20260420_213352_phase_c_affiliate_globals';
import * as migration_20260420_214651_phase_d_content_automation from './20260420_214651_phase_d_content_automation';
import * as migration_20260420_224925_product_ia_extensions from './20260420_224925_product_ia_extensions';
import * as migration_20260421_120000_articles_pages_split from './20260421_120000_articles_pages_split';
import * as migration_20260421_150000_announcements_collection from './20260421_150000_announcements_collection';

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
  {
    up: migration_20260420_214651_phase_d_content_automation.up,
    down: migration_20260420_214651_phase_d_content_automation.down,
    name: '20260420_214651_phase_d_content_automation',
  },
  {
    up: migration_20260420_224925_product_ia_extensions.up,
    down: migration_20260420_224925_product_ia_extensions.down,
    name: '20260420_224925_product_ia_extensions',
  },
  {
    up: migration_20260421_120000_articles_pages_split.up,
    down: migration_20260421_120000_articles_pages_split.down,
    name: '20260421_120000_articles_pages_split',
  },
  {
    up: migration_20260421_150000_announcements_collection.up,
    down: migration_20260421_150000_announcements_collection.down,
    name: '20260421_150000_announcements_collection',
  },
];
