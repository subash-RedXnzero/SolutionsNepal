/**
 * DEPRECATED — kept as a thin re-export so older imports keep working.
 * Import shared UI formatting from './npr.js' instead:
 *   import { formatNumber, formatNPR } from '../../lib/utils/npr.js';
 */
export {
  formatNPR,
  formatNumber,
  formatPercent,
  parseNumber,
  copyToClipboard,
} from './npr.js';
