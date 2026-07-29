import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, Easing} from 'remotion';
import {C, FONT, MONO, EASE_IN} from '../theme';
import {Glow} from '../parts';
import {DrawMark} from '../DrawMark';
import {Sfx} from '../lib/Sfx';
import {Ground} from '../Ground';

const ease = Easing.bezier(...(EASE_IN as unknown as [number, number, number, number]));

const rise = (f: number, at: number, dur = 14) =>
  interpolate(f, [at, at + dur], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });

/**
 * The line lands for the third time, and the link is held long enough to be
 * lifted with a phone from the room. A URL set in type asks a judge to memorise
 * it; the code asks them to raise the device already in their hand.
 */
export const Close: React.FC = () => {
  const f = useCurrentFrame();
  const mark = rise(f, 2);
  const line = rise(f, 16);
  const link = rise(f, 46);

  return (
    <AbsoluteFill style={{background: C.ink}}>
      <Ground tone="neutral" />
      <Sfx src="confirm.mp3" at={4} vol={0.3} />
      <Sfx src="stamp.mp3" at={48} vol={0.34} />
      <Glow size={1300} y="44%" opacity={0.06} />

      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            opacity: mark,
            transform: `scale(${0.96 + mark * 0.04})`,
          }}
        >
          <DrawMark size={72} start={2} />
          <span
            style={{
              fontFamily: FONT.display,
              fontWeight: 600,
              fontSize: 58,
              letterSpacing: '-0.035em',
              color: C.bone,
            }}
          >
            Ghost<span style={{color: C.mute}}>Ledger</span>
          </span>
        </div>

        <h1
          style={{
            margin: '46px 0 0',
            maxWidth: 1560,
            textAlign: 'center',
            fontFamily: FONT.display,
            fontWeight: 600,
            fontSize: 74,
            lineHeight: 1.12,
            letterSpacing: '-0.035em',
            color: C.bone,
            opacity: line,
            transform: `translateY(${(1 - line) * 10}px)`,
          }}
        >
          The bigger the payment, the more signatures.
          <br />
          <span style={{color: C.mute}}>And nobody sees the payment.</span>
        </h1>

        <div
          style={{
            marginTop: 66,
            display: 'flex',
            alignItems: 'center',
            gap: 30,
            opacity: link,
            transform: `translateY(${(1 - link) * 8}px)`,
          }}
        >
          <div
            style={{
              width: 134,
              height: 134,
              padding: 10,
              borderRadius: 4,
              border: `1px solid ${C.hairStrong}`,
              display: 'flex',
            }}
          >
            <Img src={staticFile('qr.svg')} style={{width: '100%', height: '100%'}} />
          </div>
          <div>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 25,
                color: C.bone,
                letterSpacing: '-0.01em',
              }}
            >
              kasbsquall.github.io/ghostledger
            </div>
            <div
              style={{
                marginTop: 7,
                fontFamily: MONO,
                fontWeight: 300,
                fontSize: 17,
                color: C.mute,
                letterSpacing: '-0.005em',
              }}
            >
              github.com/kasbsquall/ghostledger
            </div>
            <div
              style={{
                marginTop: 12,
                fontFamily: MONO,
                fontWeight: 300,
                fontSize: 14,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: C.mute,
              }}
            >
              live on ethereum sepolia · built on iExec Nox
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
