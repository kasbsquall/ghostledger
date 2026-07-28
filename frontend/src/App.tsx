import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPublicClient, createWalletClient, custom, http, isAddress } from 'viem';
import { createViemHandleClient } from '@iexec-nox/handle';
import {
  ArrowClockwise,
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

// An explicit endpoint, because viem's default for Sepolia rate-limits under a
// 15s poll and the dashboard then shows an error state that is about the RPC
// rather than about the treasury.
const publicClient = createPublicClient({
  chain: CHAIN,
  transport: http('https://ethereum-sepolia-rpc.publicnode.com', { retryCount: 3 }),
});

const SAFE_ABI = [
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'isOwner',
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export default function App() {
  const [account, setAccount] = useState<`0x${string}` | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [movements, setMovements] = useState<Movement[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [treasuryHandle, setTreasuryHandle] = useState<`0x${string}` | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [revealing, setRevealing] = useState<number | null>(null);
  const [, forceTick] = useState(0);

  const handleClient = useRef<Awaited<ReturnType<typeof createViemHandleClient>> | null>(null);
  const loadToken = useRef(0);

  const walletFor = useCallback(
    (address: `0x${string}`) =>
      createWalletClient({
        account: address,
        chain: CHAIN,
        transport: custom((window as { ethereum?: unknown }).ethereum as never),
      }),
    []
  );

  const connect = useCallback(async () => {
    const ethereum = (window as { ethereum?: unknown }).ethereum;
    if (!ethereum) {
      setError('No wallet extension detected in this browser.');
      return;
    }
    try {
      const probe = createWalletClient({ chain: CHAIN, transport: custom(ethereum as never) });
      const [address] = await probe.requestAddresses();
      await probe.switchChain({ id: CHAIN.id });
      handleClient.current = await createViemHandleClient(walletFor(address));
      setAccount(address);
      setError(null);
    } catch (cause) {
      setError(readableError(cause, 'Could not connect to Sepolia with this wallet.'));
    }
  }, [walletFor]);

  // A wallet can change account or network underneath us. Drop everything
  // derived from the old one rather than acting on stale authority.
  useEffect(() => {
    const ethereum = (window as { ethereum?: { on?: Function; removeListener?: Function } }).ethereum;
    if (!ethereum?.on) return;
    const reset = () => {
      handleClient.current = null;
      setAccount(null);
      setIsOwner(false);
    };
    ethereum.on('accountsChanged', reset);
    ethereum.on('chainChanged', reset);
    return () => {
      ethereum.removeListener?.('accountsChanged', reset);
      ethereum.removeListener?.('chainChanged', reset);
    };
  }, []);

  /** Relative timestamps go stale silently, so nudge the tree every 30s. */
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

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

      // Amounts a signer already revealed must survive a refresh, otherwise
      // every transaction silently re-hides work the user did.
      setMovements((previous) => {
        const revealed = new Map(previous?.map((m) => [m.id, m.revealed]));
        return rows.map((row) => ({ ...row, revealed: revealed.get(row.id) ?? null })).reverse();
      });
      setLoadFailed(false);

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
      setLoadFailed(true);
      setMovements([]);
      setError(readableError(cause, 'Cannot reach the treasury module right now.'));
    }
  }, [account]);

  useEffect(() => {
    void load();
    return () => {
      loadToken.current += 1;
    };
  }, [load]);

  /** Another owner signing must show up without this user doing anything. */
  useEffect(() => {
    const id = setInterval(() => void load(), 15_000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (!account) return;
    publicClient
      .readContract({
        address: ADDRESSES.safe,
        abi: SAFE_ABI,
        functionName: 'isOwner',
        args: [account],
      })
      .then(setIsOwner)
      .catch(() => setIsOwner(false));
  }, [account]);

  const send = useCallback(
    async (label: string, write: () => Promise<`0x${string}`>) => {
      setBusy(label);
      setError(null);
      try {
        const hash = await write();
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        // A receipt resolves for reverted transactions too. Without this check
        // a failure would look exactly like a success.
        if (receipt.status === 'reverted') {
          throw new Error('The transaction was mined but reverted.');
        }
      } catch (cause) {
        setError(readableError(cause, 'The transaction did not go through.'));
      } finally {
        setBusy(null);
        await load();
      }
    },
    [load]
  );

  const publishBand = useCallback(
    (movement: Movement) => {
      const client = handleClient.current;
      if (!account || !client) return;
      return send(`publish-${movement.id}`, async () => {
        // The enclave marks the band publicly decryptable after the fact, so a
        // signer who clicks the moment a movement appears gets a 403. Wait it
        // out rather than handing them a permissions error for a timing issue.
        let proof: `0x${string}` | null = null;
        for (let attempt = 0; attempt < 20 && proof === null; attempt += 1) {
          try {
            proof = (await client.publicDecrypt(movement.riskHandle)).decryptionProof;
          } catch (cause) {
            if (!/not publicly decryptable|access_denied/.test(String(cause))) throw cause;
            await new Promise((resolve) => setTimeout(resolve, 3_000));
          }
        }
        if (proof === null) throw new Error('The enclave has not published this band yet.');
        const decryptionProof = proof;
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

  const reveal = useCallback(async (movement: Movement) => {
    const client = handleClient.current;
    if (!client) return;
    const run = loadToken.current;
    setRevealing(movement.id);
    try {
      const { value } = await client.decrypt(movement.amountHandle);
      if (run !== loadToken.current) return;
      setMovements((current) =>
        current?.map((m) => (m.id === movement.id ? { ...m, revealed: BigInt(value) } : m)) ?? null
      );
    } catch (cause) {
      setError(
        readableError(cause, 'This account is not on the access list for that amount.')
      );
    } finally {
      setRevealing(null);
    }
  }, []);

  const pending = useMemo(
    () => movements?.filter((m) => m.status === 'Pending') ?? null,
    [movements]
  );
  const anomalous = useMemo(() => pending?.filter((m) => m.band === 3).length ?? null, [pending]);

  return (
    <div className="shell">
      <header className="topbar rise" style={{ '--i': 0 } as React.CSSProperties}>
        <div className="brand">
          <Mark size={26} animate />
          <div className="brand__text">
            <h1 className="brand__name">
              Ghost<span className="brand__name-dim">Ledger</span>
            </h1>
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
            <span className={`chip mono ${isOwner ? 'chip--live' : 'chip--warn'}`}>
              <Wallet size={12} weight="light" />
              {short(account)}
              {!isOwner && ' · not a signer'}
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
            <div>
              <h2>Movements</h2>
              <p className="section-head__lede">
                Publish the risk band, collect the signatures it demands, execute through the Safe.
              </p>
            </div>
            {pending !== null && movements!.length > 0 && (
              <span className="section-head__note mono">
                {pending.length} pending of {movements!.length} total
              </span>
            )}
          </div>

          {!account && (
            <p className="inline-note">
              Read-only. Connect a wallet that signs on this Safe to publish bands, sign or execute.
            </p>
          )}

          <MovementsTable
            movements={movements}
            loadFailed={loadFailed}
            canWrite={Boolean(account) && isOwner}
            canReveal={Boolean(account)}
            busy={busy}
            revealing={revealing}
            onRetry={load}
            onPublish={publishBand}
            onApprove={(m) => act(m, 'approve')}
            onExecute={(m) => act(m, 'execute')}
            onReject={(m) => act(m, 'reject')}
            onReveal={reveal}
          />
        </section>

        <aside className="col-side">
          <BalancePanel handle={treasuryHandle} anomalous={anomalous} />
          <PolicyPanel />
          <ProposeForm
            account={account}
            canWrite={Boolean(account) && isOwner}
            busy={busy}
            onDone={load}
            onError={setError}
            walletFor={walletFor}
          />
        </aside>
      </main>

      <footer className="footer mono">
        {(
          [
            ['module', ADDRESSES.module],
            ['log', ADDRESSES.log],
            ['token', ADDRESSES.token],
          ] as const
        ).map(([label, address], index) => (
          <span key={label}>
            {index > 0 && ' · '}
            {label}{' '}
            <a
              className="link"
              href={`${EXPLORER}/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {short(address)}
            </a>
          </span>
        ))}
      </footer>
    </div>
  );
}

type TableProps = {
  movements: Movement[] | null;
  loadFailed: boolean;
  canWrite: boolean;
  canReveal: boolean;
  busy: string | null;
  revealing: number | null;
  onRetry: () => void;
  onPublish: (movement: Movement) => void;
  onApprove: (movement: Movement) => void;
  onExecute: (movement: Movement) => void;
  onReject: (movement: Movement) => void;
  onReveal: (movement: Movement) => void;
};

function MovementsTable({ movements, loadFailed, onRetry, ...row }: TableProps) {
  if (movements === null) {
    return (
      <div className="table-frame" role="status" aria-label="Loading movements">
        {[0, 1, 2].map((line) => (
          <div className="skeleton-row" key={line} style={{ '--i': line } as React.CSSProperties} />
        ))}
      </div>
    );
  }

  if (loadFailed) {
    return (
      <div className="table-frame empty">
        <WarningOctagon size={26} weight="light" />
        <p>Could not read the movements.</p>
        <span>The Sepolia endpoint did not answer.</span>
        <button type="button" className="btn btn--solid" onClick={onRetry}>
          <ArrowClockwise size={13} weight="light" /> Try again
        </button>
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
    <div className="table-frame" tabIndex={0} role="region" aria-label="Treasury movements">
      <table className="movements">
        <thead>
          <tr>
            <th className="c-id">ID</th>
            <th>Destination</th>
            <th>Amount</th>
            <th>Risk band</th>
            <th>Signatures</th>
            <th className="c-time">Proposed</th>
            <th className="c-act" aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {movements.map((movement, index) => (
            <MovementRow key={movement.id} movement={movement} index={index} {...row} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

type RowProps = Omit<TableProps, 'movements' | 'loadFailed' | 'onRetry'> & {
  movement: Movement;
  index: number;
};

function MovementRow({
  movement,
  index,
  canWrite,
  canReveal,
  busy,
  revealing,
  onPublish,
  onApprove,
  onExecute,
  onReject,
  onReveal,
}: RowProps) {
  const [confirmReject, setConfirmReject] = useState(false);

  const isPending = movement.status === 'Pending';
  const isPublished = movement.band !== 0;
  const hasQuorum = movement.approvals >= movement.required;
  const running = (fn: string) => busy === `${fn}-${movement.id}`;
  const locked = busy !== null || !canWrite;
  const missing = movement.required - movement.approvals;

  return (
    <tr
      className={`rise-row ${isPending ? '' : `settled settled--${movement.status.toLowerCase()}`}`}
      style={{ '--i': Math.min(index, 7) } as React.CSSProperties}
    >
      <td className="c-id mono">{String(movement.id).padStart(2, '0')}</td>

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
            disabled={!canReveal || revealing !== null}
            aria-label={`Reveal the amount of movement ${movement.id}`}
          >
            <Lock size={12} weight="light" />
            {revealing === movement.id ? 'Decrypting' : 'Reveal amount'}
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
        {isPublished ? (
          <span className={`sigs num ${hasQuorum ? 'is-met' : ''}`}>
            {movement.approvals} / {movement.required}
          </span>
        ) : (
          <span className="sigs sigs--unknown mono">after band</span>
        )}
      </td>

      <td className="c-time mono">
        <time dateTime={new Date(movement.proposedAt * 1000).toISOString()}>
          {sinceNow(movement.proposedAt)}
        </time>
      </td>

      <td className="c-act">
        {!isPending ? (
          <span className="status mono">{movement.status}</span>
        ) : !isPublished ? (
          <button
            type="button"
            className="btn btn--solid btn--tiny"
            onClick={() => onPublish(movement)}
            disabled={locked}
            aria-label={`Publish the risk band of movement ${movement.id}`}
          >
            <SealCheck size={12} weight="light" />
            {running('publish') ? 'Publishing' : 'Publish band'}
          </button>
        ) : (
          <div className="row-actions">
            <button
              type="button"
              className={`btn btn--tiny ${confirmReject ? 'btn--danger' : 'btn--ghost'}`}
              onClick={() => (confirmReject ? onReject(movement) : setConfirmReject(true))}
              onBlur={() => setConfirmReject(false)}
              disabled={locked}
              aria-label={`Reject movement ${movement.id}`}
            >
              <Prohibit size={12} weight="light" />
              {running('reject') ? 'Rejecting' : confirmReject ? 'Confirm reject' : 'Reject'}
            </button>

            {hasQuorum ? (
              <button
                type="button"
                className="btn btn--solid btn--tiny"
                onClick={() => onExecute(movement)}
                disabled={locked}
                aria-label={`Execute movement ${movement.id}`}
              >
                <PaperPlaneTilt size={12} weight="light" />
                {running('execute') ? 'Executing' : 'Execute'}
              </button>
            ) : movement.signedByMe ? (
              <span className="waiting mono">
                signed · {missing} more {missing === 1 ? 'signer' : 'signers'}
              </span>
            ) : (
              <button
                type="button"
                className="btn btn--solid btn--tiny"
                onClick={() => onApprove(movement)}
                disabled={locked}
                aria-label={`Sign movement ${movement.id}`}
              >
                <Signature size={12} weight="light" />
                {running('approve') ? 'Signing' : 'Sign'}
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
      <div className="panel__stat panel__stat--lead">
        <span className="panel__stat-label">Anomalous and pending</span>
        {anomalous === null ? (
          <span className="skeleton-inline" />
        ) : (
          <span className={`headline num ${anomalous > 0 ? 'is-flag' : ''}`}>
            {anomalous}
            <em>{anomalous === 1 ? 'movement' : 'movements'}</em>
          </span>
        )}
      </div>

      <span className="panel__label">
        <Vault size={12} weight="light" /> Treasury balance, as the chain sees it
      </span>

      {handle === null ? (
        <div className="skeleton-block" />
      ) : (
        <>
          <div className="handle mono">{handle}</div>
          <p className="panel__note">
            Thirty-two bytes pointing at an encrypted value only the Safe can resolve. There is no
            figure to read here, by design.
          </p>
        </>
      )}
    </div>
  );
}

function PolicyPanel() {
  return (
    <div className="panel rise" style={{ '--i': 3 } as React.CSSProperties}>
      <span className="panel__label">
        <Scales size={12} weight="light" /> Risk band policy
      </span>
      <p className="panel__note">
        Every movement is compared against the treasury's own trailing average payout. The rule below
        is public so it can be audited. The figures it runs on never are.
      </p>
      <ul className="policy">
        <li>
          <i className="dot dot--idle" />
          <span>Not published</span>
          <b className="num">band not yet on-chain</b>
        </li>
        <li>
          <i className="dot dot--clear" />
          <span>Within pattern</span>
          <b className="num">
            under {POLICY.watchFactor}× avg · threshold
          </b>
        </li>
        <li>
          <i className="dot dot--watch" />
          <span>Review</span>
          <b className="num">
            {POLICY.watchFactor}–{POLICY.flagFactor}× avg · threshold + 1
          </b>
        </li>
        <li>
          <i className="dot dot--flag" />
          <span>Anomalous</span>
          <b className="num">over {POLICY.flagFactor}× avg · every owner</b>
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
  canWrite: boolean;
  busy: string | null;
  onDone: () => void;
  onError: (message: string | null) => void;
  walletFor: (address: `0x${string}`) => ReturnType<typeof createWalletClient>;
};

function ProposeForm({ account, canWrite, busy, onDone, onError, walletFor }: FormProps) {
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState('');
  const [isSending, setIsSending] = useState(false);

  const parsed = Number(amount);
  const amountTouched = amount !== '';
  const amountValid = Number.isFinite(parsed) && parsed >= 0.01;
  const destinationTouched = destination !== '';
  const destinationValid = isAddress(destination);
  const canSubmit = amountValid && destinationValid && canWrite;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!account || !canSubmit) return;

    setIsSending(true);
    onError(null);
    try {
      const wallet = walletFor(account);
      const client = await createViemHandleClient(wallet);

      const raw = BigInt(Math.round(parsed * 10 ** DECIMALS));
      const { handle, handleProof } = await client.encryptInput(raw, 'uint256', ADDRESSES.module);

      const hash = await wallet.writeContract({
        address: ADDRESSES.module,
        abi: GhostLedgerModuleAbi,
        functionName: 'propose',
        args: [handle, handleProof, destination as `0x${string}`],
        chain: CHAIN,
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status === 'reverted') throw new Error('The proposal reverted.');

      setAmount('');
      setDestination('');
    } catch (cause) {
      onError(readableError(cause, 'Could not submit the movement.'));
    } finally {
      setIsSending(false);
      onDone();
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
        <div className={`field__input ${amountTouched && !amountValid ? 'is-invalid' : ''}`}>
          <input
            className="num"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            aria-invalid={amountTouched && !amountValid}
            aria-describedby="amount-hint"
            onChange={(event) => setAmount(event.target.value)}
          />
          <em className="mono">TUSD</em>
        </div>
        {amountTouched && !amountValid && (
          <span id="amount-hint" className="field__hint field__hint--error">
            Enter a number of at least 0.01 TUSD.
          </span>
        )}
      </label>

      <label className="field">
        <span>Destination</span>
        <div
          className={`field__input ${destinationTouched && !destinationValid ? 'is-invalid' : ''}`}
        >
          <input
            className="mono"
            placeholder="0x…"
            value={destination}
            aria-invalid={destinationTouched && !destinationValid}
            aria-describedby="destination-hint"
            onChange={(event) => setDestination(event.target.value)}
          />
        </div>
        {destinationTouched && !destinationValid && (
          <span id="destination-hint" className="field__hint field__hint--error">
            That is not a valid Ethereum address.
          </span>
        )}
      </label>

      <button
        type="submit"
        className="btn btn--primary btn--full"
        disabled={!canSubmit || isSending || busy !== null}
      >
        {isSending ? 'Encrypting and signing' : 'Encrypt and propose'}
        <span className="btn__icon">
          <ArrowUpRight size={13} weight="light" />
        </span>
      </button>

      {!account && (
        <span className="field__hint">Connect a wallet to propose a movement.</span>
      )}
      {account && !canWrite && (
        <span className="field__hint">
          This address is not a signer on the Safe, so it cannot propose.
        </span>
      )}
    </form>
  );
}
