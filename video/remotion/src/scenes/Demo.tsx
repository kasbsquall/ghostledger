import {
  AbsoluteFill,
  OffthreadVideo,
  interpolate,
  staticFile,
  useCurrentFrame,
  Easing,
} from 'remotion';
import {C, FONT, MONO, EASE_IN} from '../theme';
import {num} from '../parts';
import {Sfx} from '../lib/Sfx';

const ease = Easing.bezier(...(EASE_IN as unknown as [number, number, number, number]));
const camera = Easing.bezier(0.5, 0, 0.25, 1);

const rise = (f: number, at: number, dur = 14) =>
  interpolate(f, [at, at + dur], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });

/**
 * Shot 1:1. The browser window was sized to the app's own 1312px shell and
 * recorded at 2x, so the frame is the product at native scale rather than a
 * magnified crop of a 1080p capture. An earlier cut pushed 1.9x into a 1080p
 * source, which is an upscale wearing a camera move, and it looked like one.
 *
 * The spine. 42 seconds of the real dashboard, filmed while a separate process
 * ran a full cycle against Sepolia, so every state change on screen happened
 * because it happened on chain.
 *
 * Measured: the page polls every 15s and this take's visible updates land at
 * t=77, 92 and 107. Starting at t=70 puts three real changes inside the scene
 * rather than hoping one shows up.
 *
 * An earlier take was discarded after a still showed the dashboard in its RPC
 * error state under narration claiming everything was live. A clip can be
 * technically perfect and worthless as evidence.
 */
const START_S = 88;

export const Demo: React.FC = () => {
  const f = useCurrentFrame();

  // The app centres its shell in a 1240px column, so a 1:1 capture leaves the
  // product stranded in dead space. Drive a camera at the content instead.
  // Framed on the movements table. The right rail falls outside the crop, which
  // is what keeps the annotations from landing on top of the policy panel.
  // A slow drift under everything, so the frame is never mathematically still.
  const drift = interpolate(f, [0, 1272], [1.0, 1.05], {
    extrapolateRight: 'clamp',
    easing: camera,
  });

  // Three punch-ins. Each goes in on the beat the narration names the thing,
  // holds while it is being said, and opens back out. Capped at three because
  // a film that punches on every claim stops punctuating anything.
  const punch = (at: number, hold: number, to: number) =>
    interpolate(f, [at, at + 16, at + 16 + hold, at + 16 + hold + 20], [1, to, to, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: camera,
    });
  const zoom = drift * punch(70, 120, 1.55) * punch(470, 130, 1.42) * punch(940, 190, 1.5);

  const originX = interpolate(f, [70, 86, 470, 486, 940, 956], [46, 30, 30, 44, 44, 34], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: camera,
  });
  const originY = interpolate(f, [70, 86, 470, 486, 940, 956], [42, 30, 30, 46, 46, 38], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: camera,
  });
  const panY = 0;

  const label = (at: number, until: number) =>
    interpolate(f, [at, at + 12, until - 12, until], [0, 1, 1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: ease,
    });

  return (
    <AbsoluteFill style={{background: C.ink, overflow: 'hidden'}}>
      <Sfx src="whoosh.mp3" at={1} vol={0.24} />
      <Sfx src="click.mp3" at={70} vol={0.16} />
      <Sfx src="confirm.mp3" at={470} vol={0.3} />
      <Sfx src="reject.mp3" at={940} vol={0.4} />
      <AbsoluteFill
        style={{
          transform: `scale(${zoom}) translateY(${panY}px)`,
          transformOrigin: `${originX}% ${originY}%`,
        }}
      >
        <OffthreadVideo
          src={staticFile('vid/demo.mp4')}
          startFrom={START_S * 30}
          muted
          style={{width: '100%', height: '100%', objectFit: 'cover'}}
        />
      </AbsoluteFill>

      {/* A gradient that keeps the caption band readable over a bright table. */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(to top, ${C.ink} 0%, rgba(10,12,14,0.72) 12%, transparent 34%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Three annotations, each on the beat the narration names it. */}
      <Annotation opacity={label(30, 250)} title="The amount is a handle" tone={C.bone}>
        the figure is nowhere in the transaction
      </Annotation>
      <Annotation opacity={label(430, 700)} title="Within pattern" tone={C.clear}>
        2 of 4 · the Safe&rsquo;s own threshold
      </Annotation>
      <Annotation opacity={label(900, 1250)} title="Anomalous" tone={C.flag}>
        4 of 4 · every owner must sign
      </Annotation>
    </AbsoluteFill>
  );
};

const Annotation: React.FC<{
  opacity: number;
  title: string;
  tone: string;
  children: React.ReactNode;
}> = ({opacity, title, tone, children}) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      bottom: 184,
      padding: '20px 34px 20px 78px',
      background: 'linear-gradient(to right, rgba(10,12,14,0.94) 0%, rgba(10,12,14,0.88) 70%, transparent 100%)',
      textAlign: 'left',
      opacity,
      transform: `translateY(${(1 - opacity) * 6}px)`,
    }}
  >
    <div
      style={{
        fontFamily: FONT.display,
        fontWeight: 600,
        fontSize: 40,
        letterSpacing: '-0.028em',
        color: tone,
      }}
    >
      {title}
    </div>
    <div
      style={{
        ...num,
        marginTop: 8,
        fontSize: 19,
        color: C.mute,
      }}
    >
      {children}
    </div>
  </div>
);
