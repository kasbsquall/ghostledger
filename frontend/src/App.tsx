import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPublicClient, createWalletClient, custom, http, isAddress } from 'viem';
import { createViemHandleClient } from '@iexec-nox/handle';
import {
  ArrowUpRight,
  Cube,
  FileDashed,
  Lock,
  PaperPlaneTilt,
  Prohibit,
  Scales,
  SealCheck,
  Signature,
  Vault,
  Wallet,
  WarningOctagon,
} from '@phosphor-icons/react';

import { Mark } from './components/Mark';
import { RiskBadge } from './components/RiskBadge';
import { GhostLedgerModuleAbi, ConfidentialTreasuryTokenAbi } from './lib/abis';
import {
  ADDRESSES,
  CHAIN,
  DECIMALS,
  EXPLORER,
  POLICY,
  STATUS,
  formatUsd,
  readableError,
  short,
  sinceNow,
  type Band,
  type Status,
} from './lib/config';
import './styles/tokens.css';
import './App.css';

type Movement = {
  id: number;
  destination: `0x${string}`;
  proposer: `0x${string}`;
  proposedAt: number;
  status: Status;
  band: Band;
  approvals: number;
  required: number;
  signedByMe: boolean;
  riskHandle: `0x${string}`;
  amountHandle: `0x${string}`;
  revealed: bigint | null;
};

const publicClient = createPublicClient({ chain: CHAIN, transport: http() });

export default function App() {
  const [account, setAccount] = useState<`0x${string}` | null>(null);
  const [movements, setMovements] = useState<Movement[] | null>(null);
  const [treasuryHandle, setTreasuryHandle] = useState<`0x${string}` | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const handleClient = useRef<Awaited<ReturnType<typeof createViemHandleClient>> | null>(null);
  const loadToken = useRef(0);

  const walletFor = useCallback((address: `0x${string}`) => {
    return createWalletClient({
      account: address,
      chain: CHAIN,
      transport: custom((window as { ethereum?: unknown }).ethereum as never),
    });
  }, []);

  const connect = useCallback(async () => {
    const ethereum = (window as { ethereum?: unknown }).ethereum;
    if (!ethereum) {
      setError('No wallet extension detected in this browser.');
      return;
    }
    try {
      const probe = createWalletClient({ chain: CHAIN, transport: custom(ethereum as never) });
      const [address] = await probe.requestAddresses();
      await probe.switchChain({ id: CHAIN.id }).catch(() => undefined);
      handleClient.current = await createViemHandleClient(walletFor(address));
      setAccount(address);
      setError(null);
    } catch (cause) {
      setError(readableError(cause, 'Could not connect your wallet.'));
    }
  }, [walletFor]);

  /**
   * Everything on this screen comes from contract storage. The band is read,
   * not decrypted, so a disconnected visitor sees the same truth a signer does.
   */
  const load = useCallback(async () => {
    const run = ++loadToken.current;

    try {
      const count = await publicClient.readContract({
        address: ADDRESSES.module,
        abi: GhostLedgerModuleAbi,
        functionName: 'movementCount',
      });

      const rows = await Promise.all(
        Array.from({ length: Number(count) }, async (_unused, id) => {
          const [row, required, signedByMe] = await Promise.all([
            publicClient.readContract({
              address: ADDRESSES.module,
              abi: GhostLedgerModuleAbi,
              functionName: 'movementAt',
              args: [BigInt(id)],
            }),
            publicClient.readContract({
              address: ADDRESSES.module,
              abi: GhostLedgerModuleAbi,
              functionName: 'signaturesRequired',
              args: [BigInt(id)],
            }),
            account
              ? publicClient.readContract({
                  address: ADDRESSES.module,
                  abi: GhostLedgerModuleAbi,
                  functionName: 'hasApproved',
                  args: [BigInt(id), account],
                })
              : Promise.resolve(false),
          ]);

          const [destination, proposer, proposedAt, status, band, approvals, riskHandle, amountHandle] =
            row;

          return {
            id,
            destination,
            proposer,
            proposedAt: Number(proposedAt),
            status: STATUS[Number(status)],
            band: Number(band) as Band,
            approvals: Number(approvals),
            required: Number(required),
            signedByMe: Boolean(signedByMe),
            riskHandle,
            amountHandle,
            revealed: null,
          } satisfies Movement;
        })
      );

      if (run !== loadToken.current) return;
      setMovements([...rows].reverse());

      const balance = await publicClient.readContract({
        address: ADDRESSES.token,
        abi: ConfidentialTreasuryTokenAbi,
        functionName: 'confidentialBalanceOf',
        args: [ADDRESSES.safe],
      });
      if (run !== loadToken.current) return;
      setTreasuryHandle(balance);
    } catch (cause) {
      if (run !== loadToken.current) return;
      setError(readableError(cause, 'Cannot reach the treasury module right now.'));
    }
  }, [account]);

  useEffect(() => {
    void load();
    return () => {
      loadToken.current += 1;
    };
  }, [load]);

  const send = useCallback(
    async (label: string, write: () => Promise<`0x${string}`>) => {
      setBusy(label);
      setError(null);
      try {
        const hash = await write();
        await publicClient.waitForTransactionReceipt({ hash });
        await load();
      } catch (cause) {
        setError(readableError(cause, 'The transaction did not go through.'));
      } finally {
        setBusy(null);
      }
    },
    [load]
  );

  /** Fetches the gateway proof for a band and hands it to the contract. */
  const settle = useCallback(
    (movement: Movement) => {
      const client = handleClient.current;
      if (!account || !client) return;
      return send(`settle-${movement.id}`, async () => {
        const { decryptionProof } = await client.publicDecrypt(movement.riskHandle);
        return walletFor(account).writeContract({
          address: ADDRESSES.module,
          abi: GhostLedgerModuleAbi,
          functionName: 'settle',
          args: [BigInt(movement.id), decryptionProof],
        });
      });
    },
    [account, send, walletFor]
  );

  const act = useCallback(
    (movement: Movement, fn: 'approve' | 'execute' | 'reject') => {
      if (!account) return;
      return send(`${fn}-${movement.id}`, () =>
        walletFor(account).writeContract({
          address: ADDRESSES.module,
          abi: GhostLedgerModuleAbi,
          functionName: fn,
          args: [BigInt(movement.id)],
        })
      );
    },
    [account, send, walletFor]
  );

  const reveal = useCallback(
    async (movement: Movement) => {
      const client = handleClient.current;
      if (!client) return;
      const run = loadToken.current;
      setBusy(`reveal-${movement.id}`);
      try {
        const { value } = await client.decrypt(movement.amountHandle);
        if (run !== loadToken.current) return;
        setMovements((current) =>
          current?.map((m) => (m.id === movement.id ? { ...m, revealed: BigInt(value) } : m)) ?? null
        );
      } catch {
        setError('This account is not on the access list for that amount.');
      } finally {
        setBusy(null);
      }
    },
    []
  );

  const pending = useMemo(
    () => movements?.filter((m) => m.status === 'Pending') ?? null,
    [movements]
  );
  const anomalous = useMemo(
    () => pending?.filter((m) => m.band === 3).length ?? null,
    [pending]
  );

  return (
    <div className="shell">
      <header className="topbar rise" style={{ '--i': 0 } as React.CSSProperties}>
        <div className="brand">
          <Mark size={26} animate />
          <div className="brand__text">
            <span className="brand__name">
              Ghost<span className="brand__name-dim">Ledger</span>
            </span>
            <span className="brand__line">
              How many signatures a payout needs, decided by data nobody can read
            </span>
          </div>
        </div>

        <div className="topbar__right">
          <span className="chip mono">
            <Cube size={12} weight="light" /> Sepolia
          </span>
          <a
            className="chip mono chip--link"
            href={`${EXPLORER}/address/${ADDRESSES.safe}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Vault size={12} weight="light" /> {short(ADDRESSES.safe)}
            <ArrowUpRight size={11} weight="light" />
          </a>
          {account ? (
            <span className="chip mono chip--live">
              <Wallet size={12} weight="light" /> {short(account)}
            </span>
          ) : (
            <button type="button" className="btn btn--primary" onClick={connect}>
              <Wallet size={14} weight="light" /> Connect wallet
            </button>
          )}
        </div>
      </header>

      {error && (
        <div className="alert" role="alert">
          <WarningOctagon size={15} weight="light" />
          <span>{error}</span>
          <button type="button" className="alert__close" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      <main className="grid">
        <section className="col-main rise" style={{ '--i': 1 } as React.CSSProperties}>
          <div className="section-head">
            <h2>Movements</h2>
            {pending !== null && movements!.length > 0 && (
              <span className="section-head__note mono">
                {pending.length} pending of {movements!.length} total
              </span>
            )}
          </div>
          <MovementsTable
            movements={movements}
            account={account}
            busy={busy}
            onSettle={settle}
            onApprove={(m) => act(m, 'approve')}
            onExecute={(m) => act(m, 'execute')}
            onReject={(m) => act(m, 'reject')}
            onReveal={reveal}
          />
        </section>

        <aside className="col-side">
          <BalancePanel handle={treasuryHandle} anomalous={anomalous} />
          <PolicyPanel />
          <ProposeForm account={account} busy={busy} onDone={load} onError={setError} walletFor={walletFor} />
        </aside>
      </main>

      <footer className="footer mono">
        module {short(ADDRESSES.module)} · log {short(ADDRESSES.log)} · token{' '}
        {short(ADDRESSES.token)}
      </footer>
    </div>
  );
}

type TableProps = {
  movements: Movement[] | null;
  account: `0x${string}` | null;
  busy: string | null;
  onSettle: (movement: Movement) => void;
  onApprove: (movement: Movement) => void;
  onExecute: (movement: Movement) => void;
  onReject: (movement: Movement) => void;
  onReveal: (movement: Movement) => void;
};

function MovementsTable({
  movements,
  account,
  busy,
  onSettle,
  onApprove,
  onExecute,
  onReject,
  onReveal,
}: TableProps) {
  if (movements === null) {
    return (
      <div className="table-frame">
        {[0, 1, 2].map((row) => (
          <div className="skeleton-row" key={row} style={{ '--i': row } as React.CSSProperties} />
        ))}
      </div>
    );
  }

  if (movements.length === 0) {
    return (
      <div className="table-frame empty">
        <FileDashed size={26} weight="light" />
        <p>No movements yet.</p>
        <span>Propose the first one using the form on this page.</span>
      </div>
    );
  }

  return (
    <div className="table-frame">
      <table className="movements">
        <thead>
          <tr>
            <th className="c-id">ID</th>
            <th>Destination</th>
            <th>Amount</th>
            <th>Risk</th>
            <th>Signatures</th>
            <th className="c-time">Proposed</th>
            <th className="c-act" aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {movements.map((movement, index) => (
            <MovementRow
              key={movement.id}
              movement={movement}
              index={index}
              account={account}
              busy={busy}
              onSettle={onSettle}
              onApprove={onApprove}
              onExecute={onExecute}
              onReject={onReject}
              onReveal={onReveal}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

type RowProps = Omit<TableProps, 'movements'> & { movement: Movement; index: number };

function MovementRow({
  movement,
  index,
  account,
  busy,
  onSettle,
  onApprove,
  onExecute,
  onReject,
  onReveal,
}: RowProps) {
  const isPending = movement.status === 'Pending';
  const isSettled = movement.band !== 0;
  const hasQuorum = movement.approvals >= movement.required;
  const label = (fn: string) => busy === `${fn}-${movement.id}`;
  const locked = busy !== null || !account;

  return (
    <tr
      className={`rise-row ${isPending ? '' : 'settled'}`}
      style={{ '--i': Math.min(index, 7) } as React.CSSProperties}
    >
      <td className="c-id mono">{String(movement.id + 1).padStart(2, '0')}</td>

      <td>
        <a
          className="link mono"
          href={`${EXPLORER}/address/${movement.destination}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {short(movement.destination)}
        </a>
      </td>

      <td className="c-amount">
        {movement.revealed === null ? (
          <button
            type="button"
            className="btn btn--ghost btn--tiny"
            onClick={() => onReveal(movement)}
            disabled={locked}
          >
            <Lock size={12} weight="light" />
            {label('reveal') ? 'Decrypting' : 'Encrypted'}
          </button>
        ) : (
          <span className="num revealed">
            {formatUsd(movement.revealed)} <em>TUSD</em>
          </span>
        )}
      </td>

      <td>
        <RiskBadge band={movement.band} />
      </td>

      <td className="c-sigs">
        {isSettled ? (
          <span className={`sigs num ${hasQuorum ? 'is-met' : ''}`}>
            {movement.approvals} / {movement.required}
          </span>
        ) : (
          <span className="sigs sigs--unknown mono">not set</span>
        )}
      </td>

      <td className="c-time mono">{sinceNow(movement.proposedAt)}</td>

      <td className="c-act">
        {!isPending ? (
          <span className="status mono">{movement.status}</span>
        ) : !isSettled ? (
          <button
            type="button"
            className="btn btn--solid btn--tiny"
            onClick={() => onSettle(movement)}
            disabled={locked}
          >
            <SealCheck size={12} weight="light" />
            {label('settle') ? 'Settling' : 'Settle band'}
          </button>
        ) : (
          <div className="row-actions">
            <button
              type="button"
              className="btn btn--ghost btn--tiny"
              onClick={() => onReject(movement)}
              disabled={locked}
            >
              <Prohibit size={12} weight="light" />
              {label('reject') ? 'Rejecting' : 'Reject'}
            </button>
            {hasQuorum ? (
              <button
                type="button"
                className="btn btn--solid btn--tiny"
                onClick={() => onExecute(movement)}
                disabled={locked}
              >
                <PaperPlaneTilt size={12} weight="light" />
                {label('execute') ? 'Executing' : 'Execute'}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn--solid btn--tiny"
                onClick={() => onApprove(movement)}
                disabled={locked || movement.signedByMe}
                title={movement.signedByMe ? 'You have already signed this movement' : undefined}
              >
                <Signature size={12} weight="light" />
                {label('approve') ? 'Signing' : movement.signedByMe ? 'Signed' : 'Sign'}
              </button>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}

function BalancePanel({
  handle,
  anomalous,
}: {
  handle: `0x${string}` | null;
  anomalous: number | null;
}) {
  return (
    <div className="panel rise" style={{ '--i': 2 } as React.CSSProperties}>
      <span className="panel__label">
        <Vault size={12} weight="light" /> Balance handle
      </span>

      {handle === null ? (
        <div className="skeleton-block" />
      ) : (
        <>
          <div className="handle mono">{handle}</div>
          <p className="panel__note">
            This is everything the chain reveals about the treasury. Thirty-two bytes pointing at an
            encrypted value only the Safe can resolve.
          </p>
        </>
      )}

      <div className="panel__stat">
        <span className="panel__stat-label">Anomalous and pending</span>
        {anomalous === null ? (
          <span className="skeleton-inline" />
        ) : (
          <span className={`panel__stat-value num ${anomalous > 0 ? 'is-flag' : ''}`}>
            {anomalous} <em>{anomalous === 1 ? 'movement' : 'movements'}</em>
          </span>
        )}
      </div>
    </div>
  );
}

function PolicyPanel() {
  return (
    <div className="panel rise" style={{ '--i': 3 } as React.CSSProperties}>
      <span className="panel__label">
        <Scales size={12} weight="light" /> Scoring policy
      </span>
      <p className="panel__note">
        Each movement is compared against the treasury's own trailing average payout. The rule below
        is public so it can be audited. The figures it runs on never are.
      </p>
      <ul className="policy">
        <li>
          <i className="dot dot--idle" />
          <span>Not settled</span>
          <b className="num">band not yet on-chain</b>
        </li>
        <li>
          <i className="dot dot--clear" />
          <span>Within pattern</span>
          <b className="num">under {POLICY.watchFactor}× average</b>
        </li>
        <li>
          <i className="dot dot--watch" />
          <span>Review</span>
          <b className="num">
            {POLICY.watchFactor}× to {POLICY.flagFactor}× average
          </b>
        </li>
        <li>
          <i className="dot dot--flag" />
          <span>Anomalous</span>
          <b className="num">over {POLICY.flagFactor}× average</b>
        </li>
      </ul>
      <p className="panel__note panel__note--tight">
        A higher band raises the signatures a payout needs. It can never lower them below the Safe's
        own threshold.
      </p>
    </div>
  );
}

type FormProps = {
  account: `0x${string}` | null;
  busy: string | null;
  onDone: () => void;
  onError: (message: string | null) => void;
  walletFor: (address: `0x${string}`) => ReturnType<typeof createWalletClient>;
};

function ProposeForm({ account, busy, onDone, onError, walletFor }: FormProps) {
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState('');
  const [isSending, setIsSending] = useState(false);

  const destinationTouched = destination !== '';
  const destinationValid = isAddress(destination);
  const canSubmit = Number(amount) > 0 && destinationValid;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!account || !canSubmit) return;

    setIsSending(true);
    onError(null);
    try {
      const wallet = walletFor(account);
      const client = await createViemHandleClient(wallet);

      const raw = BigInt(Math.round(Number(amount) * 10 ** DECIMALS));
      const { handle, handleProof } = await client.encryptInput(raw, 'uint256', ADDRESSES.module);

      const hash = await wallet.writeContract({
        address: ADDRESSES.module,
        abi: GhostLedgerModuleAbi,
        functionName: 'propose',
        args: [handle, handleProof, destination as `0x${string}`],
        chain: CHAIN,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      setAmount('');
      setDestination('');
      onDone();
    } catch (cause) {
      onError(readableError(cause, 'Could not submit the movement.'));
    } finally {
      setIsSending(false);
    }
  }

  return (
    <form className="panel rise" style={{ '--i': 4 } as React.CSSProperties} onSubmit={handleSubmit}>
      <span className="panel__label">
        <PaperPlaneTilt size={12} weight="light" /> Propose a movement
      </span>
      <p className="panel__note">
        The amount is encrypted in your browser before the transaction is signed, so it never appears
        in calldata.
      </p>

      <label className="field">
        <span>Amount</span>
        <div className="field__input">
          <input
            className="num"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
          <em className="mono">TUSD</em>
        </div>
      </label>

      <label className="field">
        <span>Destination</span>
        <div className={`field__input ${destinationTouched && !destinationValid ? 'is-invalid' : ''}`}>
          <input
            className="mono"
            placeholder="0x…"
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
          />
        </div>
        {destinationTouched && !destinationValid && (
          <span className="field__hint field__hint--error">
            That is not a valid Ethereum address.
          </span>
        )}
      </label>

      <button
        type="submit"
        className="btn btn--primary btn--full"
        disabled={!account || !canSubmit || isSending || busy !== null}
      >
        {isSending ? 'Encrypting and signing' : 'Encrypt and propose'}
        <span className="btn__icon">
          <ArrowUpRight size={13} weight="light" />
        </span>
      </button>

      {!account && (
        <span className="field__hint">
          Connect a wallet that signs on this Safe to propose or sign movements.
        </span>
      )}
    </form>
  );
}
