import {AbsoluteFill, interpolate, useCurrentFrame, Easing} from 'remotion';
import {C, FONT, MONO, EASE_IN} from '../theme';
import {Ground} from '../Ground';
import run from '../data/testrun.json';
import {Sfx} from '../lib/Sfx';

const ease = Easing.bezier(...(EASE_IN as unknown as [number, number, number, number]));

const rise = (f: number, at: number, dur = 14) =>
  interpolate(f, [at, at + dur], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });

/** The one line the whole scene exists to land. */
const HERO = 'rejects a risk band the enclave did not sign';

/**
 * The suite, verbatim, from `npx hardhat test` against the Nox stack running
 * in Docker. Every duration on screen is the one the runner printed.
 *
 * An earlier cut drew this beat as a diagram and a blind judge called it what
 * it was: an assertion with nice typography. Ten passing tests arriving one by
 * one, with the forgery case landing last and held, is the same claim made out
 * of evidence.
 */
export const Trust: React.FC = () => {
  const f = useCurrentFrame();

  const frame = rise(f, 2, 16);
  const head = rise(f, 250);

  return (
    <AbsoluteFill style={{background: C.ink}}>
      <Ground tone="warm" />
      <Sfx src="whoosh.mp3" at={1} vol={0.26} />
      {run.lines.map((_l, i) => (
        <Sfx key={i} src="click.mp3" at={34 + i * 17} vol={0.075} />
      ))}
      <Sfx src="stamp.mp3" at={187} vol={0.4} />
      <Sfx src="confirm.mp3" at={222} vol={0.3} />

      <AbsoluteFill style={{padding: '64px 90px 0', alignItems: 'center'}}>
        <div
          style={{
            width: '100%',
            maxWidth: 1740,
            borderRadius: 6,
            border: `1px solid ${C.hairStrong}`,
            background: C.graphite,
            boxShadow: '0 40px 110px rgba(0,0,0,0.62)',
            opacity: frame,
            transform: `translateY(${(1 - frame) * 12}px)`,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '14px 24px',
              background: C.slate,
              borderBottom: `1px solid ${C.hair}`,
              fontFamily: MONO,
              fontSize: 17,
              color: C.mute,
            }}
          >
            <span style={{color: C.clear}}>$</span> npx hardhat test
            <span style={{marginLeft: 'auto', fontSize: 14, letterSpacing: '0.1em'}}>
              nox stack · intel tdx runner · docker
            </span>
          </div>

          <div style={{padding: '26px 30px 30px'}}>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 19,
                color: C.dim,
                marginBottom: 16,
                opacity: rise(f, 20),
              }}
            >
              {run.suite}
            </div>

            {run.lines.map(([name, ms], i) => {
              const isHero = name === HERO;
              const at = 34 + i * 17;
              const o = rise(f, at, 10);
              // Typed at 50 chars/sec, the rate that reads as a machine writing
              // rather than an element animating in.
              const typed = Math.max(
                0,
                Math.min(name.length, Math.round(((f - at) / 30) * 50))
              );
              return (
                <div
                  key={name}
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 18,
                    padding: '8px 0',
                    opacity: o,
                    transform: `translateX(${(1 - o) * -8}px)`,
                  }}
                >
                  <span style={{color: isHero ? C.flag : C.clear, fontSize: 24}}>✔</span>
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 24,
                      color: isHero ? C.bone : C.dim,
                      letterSpacing: '-0.005em',
                    }}
                  >
                    {name.slice(0, typed)}
                  </span>
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontFamily: MONO,
                      fontSize: 18,
                      color: C.faint,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {typed >= name.length ? ms : ''}
                  </span>
                </div>
              );
            })}

            <div
              style={{
                marginTop: 18,
                paddingTop: 16,
                borderTop: `1px solid ${C.hair}`,
                fontFamily: MONO,
                fontSize: 22,
                color: C.clear,
                opacity: rise(f, 220),
              }}
            >
              {run.total}
            </div>
          </div>
        </div>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background: `linear-gradient(to top, ${C.ink} 6%, rgba(10,12,14,0.9) 17%, transparent 32%)`,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: 90,
          bottom: 190,
          maxWidth: 1500,
          opacity: head,
          transform: `translateY(${(1 - head) * 8}px)`,
        }}
      >
        <span
          style={{
            fontFamily: FONT.display,
            fontWeight: 600,
            fontSize: 46,
            letterSpacing: '-0.03em',
            color: C.bone,
          }}
        >
          Hand it a band the enclave never signed,{' '}
          <span style={{color: C.flag}}>and the transaction reverts.</span>
        </span>
      </div>
    </AbsoluteFill>
  );
};
