import { strict as assert } from 'node:assert';
import { describe, it, before } from 'node:test';
import { nox } from '@iexec-nox/nox-hardhat-plugin';

const BAND_CLEAR = 1n;
const BAND_WATCH = 2n;
const BAND_FLAG = 3n;

const WATCH_FACTOR = 2n;
const FLAG_FACTOR = 5n;

/** A 2-of-3 Safe. The module must never settle for fewer than two. */
const SAFE_THRESHOLD = 2n;

const UNIT = 1_000_000n; // TUSD has 6 decimals
const TREASURY_FUNDING = 500_000n * UNIT;

/** The DAO's normal rhythm: four payouts averaging about 100 TUSD. */
const HISTORY = [100n, 120n, 90n, 90n].map((n) => n * UNIT);

const ATTACKER = '0x00000000000000000000000000000000000000b2' as const;

describe('GhostLedgerModule end to end', () => {
  let viem: any;
  let owners: any[];
  let vendor: `0x${string}`;
  let usd: any;
  let token: any;
  let safe: any;
  let log: any;
  let ghostModule: any;

  before(async () => {
    ({ viem } = await nox.connect());
    const wallets = await viem.getWalletClients();
    owners = wallets.slice(0, 3);

    // An ERC-7984 transfer only grants the recipient access to its own balance,
    // so to assert a payout landed the test has to be the recipient.
    vendor = owners[0].account.address;

    usd = await viem.deployContract('TreasuryUSD', []);
    token = await viem.deployContract('ConfidentialTreasuryToken', [
      'Confidential Treasury USD',
      'cTUSD',
      '',
      usd.address,
    ]);

    safe = await viem.deployContract('MockSafe', [
      owners.map((owner) => owner.account.address),
      SAFE_THRESHOLD,
    ]);
    log = await viem.deployContract('ConfidentialTreasuryLog', [WATCH_FACTOR, FLAG_FACTOR]);
    ghostModule = await viem.deployContract('GhostLedgerModule', [
      safe.address,
      token.address,
      log.address,
    ]);

    await log.write.setRecorder([ghostModule.address]);
    await safe.write.enableModule([ghostModule.address]);

    await usd.write.mint([owners[0].account.address, TREASURY_FUNDING]);
    await usd.write.approve([token.address, TREASURY_FUNDING]);
    await token.write.wrap([safe.address, TREASURY_FUNDING]);

    for (const amount of HISTORY) {
      const { handle, handleProof } = await nox.encryptInput(amount, 'uint256', log.address);
      await log.write.seedHistory([handle, handleProof]);
    }
  });

  /** Proposes, then brings the decrypted band on-chain with its gateway proof. */
  async function proposeAndSettle(amount: bigint, destination: `0x${string}`) {
    const { handle, handleProof } = await nox.encryptInput(
      amount,
      'uint256',
      ghostModule.address
    );
    await ghostModule.write.propose([handle, handleProof, destination]);

    const proposals = await ghostModule.getEvents.MovementProposed();
    const last = proposals[proposals.length - 1];
    const id = last.args.id as bigint;

    const { value, decryptionProof } = await nox.publicDecrypt(
      last.args.riskHandle as `0x${string}`
    );
    await ghostModule.write.settle([id, decryptionProof]);

    return { id, band: value as bigint };
  }

  async function approveWith(id: bigint, count: number) {
    for (let i = 0; i < count; i += 1) {
      await ghostModule.write.approve([id], { account: owners[i].account });
    }
  }

  it('routes a routine payout through the Safe on its own threshold', async () => {
    const { id, band } = await proposeAndSettle(110n * UNIT, vendor);
    assert.equal(band, BAND_CLEAR);
    assert.equal(await ghostModule.read.signaturesRequired([id]), SAFE_THRESHOLD);

    await approveWith(id, 2);
    await ghostModule.write.execute([id]);

    const balance = await token.read.confidentialBalanceOf([vendor]);
    const { value } = await nox.decrypt(balance as `0x${string}`);
    assert.equal(value, 110n * UNIT, 'the vendor should have received the payout');
  });

  it('demands every owner before a flagged drain can move', async () => {
    const { id, band } = await proposeAndSettle(400_000n * UNIT, ATTACKER);
    assert.equal(band, BAND_FLAG);
    assert.equal(await ghostModule.read.signaturesRequired([id]), 3n, 'flag demands all owners');

    // The Safe's own threshold is not enough for an anomaly.
    await approveWith(id, 2);
    await assert.rejects(
      () => ghostModule.write.execute([id]),
      'two of three must not be able to drain the treasury'
    );
  });

  it('raises the bar by one signature for a movement in the review band', async () => {
    const { id, band } = await proposeAndSettle(300n * UNIT, vendor);
    assert.equal(band, BAND_WATCH);
    assert.equal(await ghostModule.read.signaturesRequired([id]), SAFE_THRESHOLD + 1n);
  });

  it('refuses to execute before the band has been settled', async () => {
    const { handle, handleProof } = await nox.encryptInput(
      120n * UNIT,
      'uint256',
      ghostModule.address
    );
    await ghostModule.write.propose([handle, handleProof, vendor]);
    const proposals = await ghostModule.getEvents.MovementProposed();
    const id = proposals[proposals.length - 1].args.id as bigint;

    await assert.rejects(() => ghostModule.write.approve([id]), 'nobody signs blind');
    await assert.rejects(() => ghostModule.write.execute([id]));
  });

  it('never exposes the amount, only the band', async () => {
    const { id, band } = await proposeAndSettle(450_000n * UNIT, ATTACKER);
    assert.equal(band, BAND_FLAG);

    const [, , , , , , , amountHandle] = await ghostModule.read.movementAt([id]);
    await assert.rejects(
      () => nox.publicDecrypt(amountHandle as `0x${string}`),
      'a flagged amount must not leak through public decryption'
    );
  });

  it('keeps a rejected movement out of the baseline', async () => {
    const { id } = await proposeAndSettle(400_000n * UNIT, ATTACKER);
    await ghostModule.write.reject([id]);

    const { band } = await proposeAndSettle(115n * UNIT, vendor);
    assert.equal(band, BAND_CLEAR, 'a rejected anomaly must not raise the bar');
  });

  it('counts each owner once', async () => {
    const { id } = await proposeAndSettle(105n * UNIT, vendor);
    await ghostModule.write.approve([id]);
    await assert.rejects(() => ghostModule.write.approve([id]), 'double counting a signer');
  });

  it('never says "all clear" before it has any history to judge against', async () => {
    const freshLog = await viem.deployContract('ConfidentialTreasuryLog', [
      WATCH_FACTOR,
      FLAG_FACTOR,
    ]);
    const freshModule = await viem.deployContract('GhostLedgerModule', [
      safe.address,
      token.address,
      freshLog.address,
    ]);
    await freshLog.write.setRecorder([freshModule.address]);

    const { handle, handleProof } = await nox.encryptInput(
      1n * UNIT,
      'uint256',
      freshModule.address
    );
    await freshModule.write.propose([handle, handleProof, vendor]);

    const proposals = await freshModule.getEvents.MovementProposed();
    const { value } = await nox.publicDecrypt(
      proposals[proposals.length - 1].args.riskHandle as `0x${string}`
    );
    assert.equal(value, BAND_WATCH, 'an empty baseline must fall back to human review');
  });

  it('refuses proposals from an address that is not a Safe owner', async () => {
    const wallets = await viem.getWalletClients();
    const outsider = wallets[4];
    const { handle, handleProof } = await nox.encryptInput(
      50n * UNIT,
      'uint256',
      ghostModule.address
    );

    await assert.rejects(() =>
      ghostModule.write.propose([handle, handleProof, vendor], { account: outsider.account })
    );
  });
});
