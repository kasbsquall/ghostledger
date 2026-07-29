import {
  AbsoluteFill,
  OffthreadVideo,
  interpolate,
  staticFile,
  useCurrentFrame,
  Easing,
} from 'remotion';
import {C, FONT, MONO, EASE_IN} from '../theme';
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
  // The capture fills the frame edge to edge, so there is no margin to spend:
  // every point of zoom eats real column. At 1.05 with the origin out at 76%
  // the drift alone was clipping the table's own heading to "ovements", before
  // any punch had fired. 1.02 is still a frame that breathes and never cuts.
  const drift = interpolate(f, [0, 1272], [1.0, 1.02], {
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
  // Capped. The earlier set peaked at 1.05 × 1.5, and at that scale the table's
  // own left-hand labels ran off the frame: "Movements" arrived as "ements",
  // "Reveal amount" as "veal amount". A punch that amputates the words it is
  // pointing at is not emphasis. These hold the gesture and keep the column.
  const zoom = drift * punch(90, 150, 1.32) * punch(450, 160, 1.28) * punch(820, 200, 1.22);

  // Held low on purpose. With transform-origin at x%, a scale of s pushes the
  // left edge to x·(1−s): the further right the origin sits, the more of the
  // left-hand column leaves the frame. Keeping it under 30% means the ID and
  // destination columns, and the heading above them, survive every punch.
  const originX = interpolate(f, [90, 106, 450, 466, 820, 836], [22, 12, 12, 20, 20, 28], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: camera,
  });
  const originY = interpolate(f, [90, 106, 450, 466, 820, 836], [42, 34, 34, 44, 44, 34], {
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
      <Sfx src="click.mp3" at={90} vol={0.16} />
      <Sfx src="confirm.mp3" at={450} vol={0.28} />
      <Sfx src="reject.mp3" at={620} vol={0.34} />
      <Sfx src="click.mp3" at={820} vol={0.14} />
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

      {/* Three annotations, each on the beat the narration names it.
          Each used to carry a second line, and every one of them repeated the
          narration verbatim while the burned subtitle was already saying it at
          the bottom of the frame. Two type systems, same words, different
          heights: a judge reading both wondered whether they were two claims.
          Only the editorial line survives, the one the voice does not say. */}
      <Annotation opacity={label(40, 380)} title="Where the amount should be" tone={C.bone} />
      <Annotation opacity={label(410, 780)} title="Green moved on two. Red needs four." tone={C.clear} />
      <Annotation opacity={label(810, 1090)} title="The balance, as the chain sees it" tone={C.bone} />
    </AbsoluteFill>
  );
};

const Annotation: React.FC<{
  opacity: number;
  title: string;
  tone: string;
}> = ({opacity, title, tone}) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      bottom: 200,
      padding: '18px 34px 18px 78px',
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
  </div>
);
