import { CheckCircle, Eye, WarningDiamond, DotsThree } from '@phosphor-icons/react';
import type { Band } from '../lib/config';

const BANDS = {
  0: { label: 'Not settled', tone: 'idle', Icon: DotsThree },
  1: { label: 'Within pattern', tone: 'clear', Icon: CheckCircle },
  2: { label: 'Review', tone: 'watch', Icon: Eye },
  3: { label: 'Anomalous', tone: 'flag', Icon: WarningDiamond },
} as const;

/**
 * The band is read from contract storage, not decrypted in the browser, so it
 * is either known or genuinely absent. Band 0 means the TEE result has not been
 * brought on-chain yet, which is a state a signer can act on rather than a
 * spinner they have to wait out.
 */
export function RiskBadge({ band }: { band: Band }) {
  const { label, tone, Icon } = BANDS[band];

  return (
    <span className={`badge badge--${tone}`}>
      <Icon size={13} weight="light" />
      {label}
    </span>
  );
}
