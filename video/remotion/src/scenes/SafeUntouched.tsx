import {AbsoluteFill, interpolate, useCurrentFrame, Easing} from 'remotion';
import {C, FONT, MONO, EASE_IN} from '../theme';
import {Glow, Kicker, RiskBadge, num} from '../parts';
import {Ground} from '../Ground';

const ease = Easing.bezier(...(EASE_IN as unknown as [number, number, number, number]));

const rise = (f: number, at: number, dur = 14) =>
  interpolate(f, [at, at + dur], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });

const ROWS = [
  {band: 'clear' as const, need: '2 of 4', note: 'the Safe’s own threshold'},
  {band: 'watch' as const, need: '3 of 4', note: 'threshold + 1'},
  {band: 'flag' as const, need: '4 of 4', note: 'every owner'},
];

/**
 * The brief's central constraint, stated plainly because no earlier cut said it
 * at all: nothing underneath is modified. The table is the product's actual
 * escalation, read from the deployed Safe (4 owners, threshold 2).
 */
export const SafeUntouched: React.FC = () => {
  const f = useCurrentFrame();
  const head = rise(f, 4);
  const call = rise(f, 40);
  const floor = rise(f, 250);

  return (
    <AbsoluteFill style={{background: C.ink}}>
      <Ground tone="cool" />
      <Glow size={1000} x="30%" y="50%" opacity={0.05} />

      <AbsoluteFill style={{padding: '80px 110px', justifyContent: 'center'}}>
        <div style={{opacity: head, transform: `translateY(${(1 - head) * 8}px)`}}>
          <Kicker>safe’s contract is unmodified</Kicker>
        </div>

        <div
          style={{
            marginTop: 30,
            alignSelf: 'flex-start',
            padding: '22px 30px',
            border: `1px solid ${C.hairStrong}`,
            borderRadius: 3,
            background: C.graphite,
            fontFamily: MONO,
            fontSize: 31,
            color: C.bone,
            opacity: call,
            transform: `translateY(${(1 - call) * 10}px)`,
          }}
        >
          enableModule(0xf6bc…4b08)
          <span style={{marginLeft: 22, fontSize: 16, color: C.mute}}>
            safe’s own extension point
          </span>
        </div>

        <div style={{marginTop: 60, display: 'flex', flexDirection: 'column', gap: 2}}>
          {ROWS.map((r, i) => {
            const o = rise(f, 90 + i * 26);
            return (
              <div
                key={r.band}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '400px 260px 1fr',
                  alignItems: 'center',
                  gap: 40,
                  padding: '22px 28px',
                  background: C.graphite,
                  borderBottom: `1px solid ${C.hair}`,
                  opacity: o,
                  transform: `translateY(${(1 - o) * 8}px)`,
                }}
              >
                <RiskBadge band={r.band} scale={1.25} />
                <span style={{...num, fontSize: 42, color: C.bone}}>{r.need}</span>
                <span style={{fontFamily: FONT.text, fontSize: 29, color: C.mute}}>
                  {r.note}
                </span>
              </div>
            );
          })}
        </div>

        <p
          style={{
            marginTop: 46,
            margin: '46px 0 0',
            maxWidth: 1620,
            fontFamily: FONT.text,
            fontSize: 36,
            lineHeight: 1.4,
            color: C.dim,
            opacity: floor,
            transform: `translateY(${(1 - floor) * 10}px)`,
          }}
        >
          It can only ever <span style={{color: C.bone}}>raise</span> the number of
          signatures a payout needs. Never lower it.
        </p>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
