import {AbsoluteFill, OffthreadVideo, interpolate, staticFile, useCurrentFrame, Easing} from 'remotion';
import {C, FONT, MONO, EASE_IN} from '../theme';
import {Glow, Mark, Headline, Kicker, num} from '../parts';
import {Ground} from '../Ground';

const ease = Easing.bezier(...(EASE_IN as unknown as [number, number, number, number]));

const rise = (f: number, at: number, dur = 14) =>
  interpolate(f, [at, at + dur], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });

/**
 * 26 seconds carrying the whole premise. Every blind judge either read "Safe"
 * as an adjective or hit the same question: if nobody sees the payment, how
 * does anything know it is bigger. Both are answered here, before the demo,
 * because everything downstream is unreadable otherwise.
 */
export const Intro: React.FC = () => {
  const f = useCurrentFrame();

  const brand = rise(f, 4);
  const owners = rise(f, 40);
  const module_ = rise(f, 190);
  const sealed = rise(f, 400);
  const card = rise(f, 610);

  return (
    <AbsoluteFill style={{background: C.ink}}>
      <Ground tone="neutral" />

      {/* The product, behind everything, at low contrast. Real footage rather
          than a texture: the frame has something true in it even when the beat
          is carried by words. */}
      <AbsoluteFill style={{opacity: 0.16}}>
        <OffthreadVideo
          src={staticFile('vid/demo.mp4')}
          startFrom={18 * 30}
          muted
          style={{width: '100%', height: '100%', objectFit: 'cover'}}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{background: `linear-gradient(105deg, ${C.ink} 34%, rgba(10,12,14,0.82) 62%, rgba(10,12,14,0.55) 100%)`}}
      />
      <Glow size={1200} y="46%" opacity={0.05} />

      <AbsoluteFill style={{padding: '80px 110px', justifyContent: 'center'}}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            opacity: brand,
            transform: `translateY(${(1 - brand) * 8}px)`,
          }}
        >
          <Mark size={54} />
          <span
            style={{
              fontFamily: FONT.display,
              fontWeight: 600,
              fontSize: 40,
              letterSpacing: '-0.03em',
              color: C.bone,
            }}
          >
            Ghost<span style={{color: C.mute}}>Ledger</span>
          </span>
        </div>

        <div style={{marginTop: 64, display: 'flex', flexDirection: 'column', gap: 40}}>
          <div style={{opacity: owners, transform: `translateY(${(1 - owners) * 10}px)`}}>
            <Kicker>Safe · the multisig most DAOs keep their money in</Kicker>
            <div style={{display: 'flex', gap: 14, marginTop: 22, alignItems: 'center'}}>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 86,
                    height: 86,
                    border: `1px solid ${C.hairStrong}`,
                    borderRadius: 3,
                    background: C.graphite,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: rise(f, 52 + i * 8),
                  }}
                >
                  <span style={{...num, fontSize: 15, color: C.mute}}>0{i + 1}</span>
                </div>
              ))}
              <span
                style={{
                  marginLeft: 20,
                  fontFamily: FONT.text,
                  fontSize: 29,
                  color: C.dim,
                  opacity: rise(f, 96),
                }}
              >
                four owners · two signatures to move money
              </span>
            </div>
          </div>

          <Headline
            size={74}
            style={{
              maxWidth: 1660,
              opacity: module_,
              transform: `translateY(${(1 - module_) * 10}px)`,
            }}
          >
            GhostLedger is a module you add to one. An unusual payout needs more
            signatures than a routine one.
          </Headline>

          <p
            style={{
              margin: 0,
              maxWidth: 1500,
              fontFamily: FONT.text,
              fontSize: 37,
              lineHeight: 1.42,
              color: C.dim,
              opacity: sealed,
              transform: `translateY(${(1 - sealed) * 10}px)`,
            }}
          >
            It runs the comparison inside a sealed processor that hands back a verdict and
            not the number. The treasury learns a payout is large{' '}
            <span style={{color: C.bone}}>without anyone learning how large.</span>
          </p>

          <div
            style={{
              alignSelf: 'flex-start',
              padding: '20px 28px',
              border: `1px solid ${C.hairStrong}`,
              borderRadius: 3,
              background: C.graphite,
              opacity: card,
              transform: `translateY(${(1 - card) * 10}px)`,
            }}
          >
            <span
              style={{
                fontFamily: MONO,
                fontWeight: 400,
                fontSize: 25,
                letterSpacing: '0.14em',
                color: C.bone,
              }}
            >
              BAND
            </span>
            <span
              style={{
                marginLeft: 26,
                fontFamily: FONT.text,
                fontSize: 27,
                color: C.dim,
              }}
            >
              the verdict on a payout: within pattern, review, or anomalous
            </span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
