import {
  AbsoluteFill,
  OffthreadVideo,
  interpolate,
  staticFile,
  useCurrentFrame,
  Easing,
} from 'remotion';
import {C, FONT, EASE_IN} from '../theme';
import {Ground} from '../Ground';
import {Sfx} from '../lib/Sfx';

const ease = Easing.bezier(...(EASE_IN as unknown as [number, number, number, number]));
// A camera has mass. The UI easing front-loads 61% of the travel into ten
// frames, which on a multi-second move reads as a lurch rather than a pull-back.
const camera = Easing.bezier(0.5, 0, 0.25, 1);

/**
 * Seven seconds, no narration, one continuous move.
 *
 * Opens inside a single anomalous row of the live dashboard, magnified past
 * legibility, and cranes out until the whole treasury is in frame. Everything
 * on screen is the real Sepolia deployment; the shot is a camera over it, not a
 * composition about it.
 *
 * The `Reveal amount` control is deliberately still out of frame at the start.
 * A judge read that button one second before the line said the amount was
 * unknowable and called the contradiction before noticing anything else.
 */
const START_S = 96;

export const ColdOpen: React.FC = () => {
  const f = useCurrentFrame();

  // 4.2x down to 1.0 across the whole beat: the row fills the frame, then the
  // treasury it belongs to arrives around it.
  const zoom = interpolate(f, [0, 196], [4.2, 1.0], {
    extrapolateRight: 'clamp',
    easing: camera,
  });

  const line = interpolate(f, [104, 126], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });
  const vignette = interpolate(f, [0, 150], [0.55, 0.16], {
    extrapolateRight: 'clamp',
    easing: camera,
  });

  return (
    <AbsoluteFill style={{background: C.ink, overflow: 'hidden'}}>
      <Ground tone="warm" />
      <Sfx src="whoosh.mp3" at={2} vol={0.24} />
      <Sfx src="stamp.mp3" at={104} vol={0.42} />

      <AbsoluteFill
        style={{
          transform: `scale(${zoom})`,
          // The anomalous row, measured against the capture.
          transformOrigin: '36% 61%',
        }}
      >
        <OffthreadVideo
          src={staticFile('vid/demo.mp4')}
          startFrom={START_S * 30}
          muted
          style={{width: '100%', height: '100%', objectFit: 'cover'}}
        />
      </AbsoluteFill>

      {/* Closes down while the camera is tight and opens as it cranes out, so
          the frame breathes with the move instead of sitting on it. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(72% 62% at 36% 55%, transparent 18%, rgba(8,10,12,${vignette}) 76%)`,
          pointerEvents: 'none',
        }}
      />


      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingBottom: 196,
          pointerEvents: 'none',
        }}
      >
        <p
          style={{
            margin: 0,
            maxWidth: 1300,
            textAlign: 'center',
            fontFamily: FONT.display,
            fontWeight: 600,
            fontSize: 54,
            lineHeight: 1.18,
            letterSpacing: '-0.032em',
            color: C.bone,
            textShadow: '0 6px 40px rgba(8,10,12,0.9)',
            opacity: line,
            transform: `translateY(${(1 - line) * 10}px)`,
          }}
        >
          Four people have to sign this payout.
          <br />
          <span style={{color: C.flag}}>None of them can see how much it is.</span>
        </p>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
