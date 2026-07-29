import { sepolia } from 'viem/chains';
import deployment from '../../../deployments/sepolia.json';

export const CHAIN = sepolia;

export const ADDRESSES = {
  safe: deployment.safe as `0x${string}`,
  module: deployment.ghostLedgerModule as `0x${string}`,
  log: deployment.treasuryLog as `0x${string}`,
  token: deployment.confidentialToken as `0x${string}`,
  usd: deployment.treasuryUSD as `0x${string}`,
};

/** The scoring policy is public so anyone can audit the rule. */
export const POLICY = {
  watchFactor: deployment.watchFactor,
  flagFactor: deployment.flagFactor,
};

/** TreasuryUSD uses six decimals, like most stablecoins. */
export const DECIMALS = 6;
export const UNIT = 10n ** BigInt(DECIMALS);

export const STATUS = ['Pending', 'Executed', 'Rejected'] as const;
export type Status = (typeof STATUS)[number];

/** Band 0 means the TEE result has not been brought on-chain yet. */
export type Band = 0 | 1 | 2 | 3;

/** Blockscout, to match the verified sources the README links. */
export const EXPLORER = 'https://eth-sepolia.blockscout.com';

export function short(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function formatUsd(raw: bigint) {
  const whole = raw / UNIT;
  const cents = (raw % UNIT) / 10_000n;
  return `${whole.toLocaleString('en-US')}.${cents.toString().padStart(2, '0')}`;
}

export function sinceNow(timestamp: number) {
  const seconds = Math.max(0, Math.floor(Date.now() / 1000) - timestamp);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

/**
 * Wallet and RPC libraries surface internal strings that mean nothing to a
 * treasury signer. Map the cases worth acting on, keep the rest generic.
 */
export function readableError(cause: unknown, fallback: string): string {
  const raw =
    cause && typeof cause === 'object' && 'shortMessage' in cause
      ? String((cause as { shortMessage: unknown }).shortMessage)
      : '';

  if (/User rejected|denied/i.test(raw)) return 'You dismissed the request in your wallet.';
  if (/NotSafeOwner/.test(raw)) return 'That address is not a signer on this Safe.';
  if (/AlreadyApproved/.test(raw)) return 'You have already signed this movement.';
  if (/NotEnoughApprovals/.test(raw)) return 'This movement still needs more signatures.';
  if (/BandNotSettled/.test(raw)) return 'Settle the risk band before signing.';
  if (/NotPending/.test(raw)) return 'This movement has already been settled or rejected.';
  if (/insufficient funds/i.test(raw)) return 'Not enough Sepolia ETH to cover gas.';
  return fallback;
}
