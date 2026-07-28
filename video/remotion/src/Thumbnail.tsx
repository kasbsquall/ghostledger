import {AbsoluteFill} from 'remotion';
import {C, FONT, MONO} from './theme';
import {Mark, RiskBadge, num} from './parts';
import {Ground} from './Ground';

/**
 * Authored at 1280x720, not grabbed from the film. A still composed for a 1920
 * canvas is a grey smear at the 168px a sidebar renders, so the type here is
 * sized for the small end and the object carries the frame before any letter
 * inside it is read.
 *
 * The object is the escalation itself: the one image that compresses the whole
 * argument. Not the end card, which is a logo on an empty ground and therefore
 * exactly the low-information frame the platform would have picked by itself.
 */
export const Thumbnail: React.FC = () => (
  <AbsoluteFill style={{background: C.ink}}>
    <Ground tone="warm" />

    <AbsoluteFill style={{padding: '52px 64px', justifyContent: 'space-between'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
        <Mark size={34} />
        <span
          style={{
            fontFamily: FONT.display,
            fontWeight: 600,
            fontSize: 26,
            letterSpacing: '-0.03em',
            color: C.bone,
          }}
        >
          Ghost<span style={{color: C.mute}}>Ledger</span>
        </span>
      </div>

      <div>
        <div
          style={{
            fontFamily: FONT.display,
            fontWeight: 600,
            fontSize: 92,
            lineHeight: 0.97,
            letterSpacing: '-0.04em',
            color: C.bone,
            maxWidth: 1080,
          }}
        >
          Nobody sees
          <br />
          the payment.
        </div>

        <div style={{display: 'flex', alignItems: 'center', gap: 22, marginTop: 34}}>
          <RiskBadge band="flag" scale={1.5} />
          <span style={{...num, fontSize: 54, color: C.flag}}>4 of 4</span>
          <span
            style={{
              fontFamily: MONO,
              fontWeight: 300,
              fontSize: 17,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: C.mute,
            }}
          >
            signatures required
          </span>
        </div>
      </div>

      <span
        style={{
          fontFamily: MONO,
          fontWeight: 300,
          fontSize: 16,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: C.faint,
        }}
      >
        a safe module on iexec nox · live on ethereum sepolia
      </span>
    </AbsoluteFill>
  </AbsoluteFill>
);
