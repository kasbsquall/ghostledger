import {AbsoluteFill} from 'remotion';
import {C, FONT} from './theme';
import {Mark} from './parts';
import {Ground} from './Ground';

/**
 * The 480x480 avatar the platform asks for. The mark alone at this size, with
 * the wordmark under it: a listing renders it small enough that a sentence
 * would be a smear, and the diamond is what makes it recognisable in a grid.
 */
export const Logo480: React.FC = () => (
  <AbsoluteFill style={{background: C.ink}}>
    <Ground tone="neutral" />
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', gap: 30}}>
      <Mark size={190} />
      <span
        style={{
          fontFamily: FONT.display,
          fontWeight: 600,
          fontSize: 46,
          letterSpacing: '-0.035em',
          color: C.bone,
        }}
      >
        Ghost<span style={{color: C.mute}}>Ledger</span>
      </span>
    </AbsoluteFill>
  </AbsoluteFill>
);
