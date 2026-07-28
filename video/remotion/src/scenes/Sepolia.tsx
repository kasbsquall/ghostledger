import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, Easing} from 'remotion';
import {C, MONO, EASE_IN} from '../theme';
import {Ground} from '../Ground';

const ease = Easing.bezier(...(EASE_IN as unknown as [number, number, number, number]));
const camera = Easing.bezier(0.5, 0, 0.25, 1);

const rise = (f: number, at: number, dur = 14) =>
  interpolate(f, [at, at + dur], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });

/**
 * Six seconds of somebody else's website. The contract page on a public
 * explorer, carrying the address, 34 transactions and 33 logs, is worth more
 * than any figure this film could set in its own typeface: a judge can open the
 * same URL and see the same page.
 *
 * Etherscan sits behind a Cloudflare bot wall, so this is Blockscout, which
 * indexes the same chain. The capture is cropped above the ad the explorer
 * serves; nothing inside the interface itself is retouched.
 */
export const Sepolia: React.FC = () => {
  const f = useCurrentFrame();
  const shot = rise(f, 2, 16);

  const push = interpolate(f, [0, 200], [1.0, 1.05], {
    extrapolateRight: 'clamp',
    easing: camera,
  });

  return (
    <AbsoluteFill style={{background: C.ink}}>
      <Ground tone="cool" />

      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingTop: 78,
          opacity: shot,
          transform: `scale(${push}) translateY(${(1 - shot) * 12}px)`,
        }}
      >
        {/* Browser chrome, because the claim is "this is deployed" and a
            full-bleed capture with no address bar reads as a slide. */}
        <div
          style={{
            width: 1680,
            borderRadius: 8,
            overflow: 'hidden',
            border: `1px solid ${C.hairStrong}`,
            boxShadow: '0 48px 120px rgba(0,0,0,0.72)',
            background: C.graphite,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '13px 20px',
              background: C.slate,
              borderBottom: `1px solid ${C.hair}`,
            }}
          >
            <span style={{display: 'flex', gap: 7}}>
              {[0, 1, 2].map((i) => (
                <i
                  key={i}
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: '50%',
                    background: C.faint,
                    opacity: 0.5,
                  }}
                />
              ))}
            </span>
            <span
              style={{
                flex: 1,
                marginLeft: 10,
                padding: '7px 16px',
                borderRadius: 4,
                background: C.ink,
                fontFamily: MONO,
                fontSize: 17,
                color: C.dim,
              }}
            >
              eth-sepolia.blockscout.com/address/0xf6bc97f8a9f399dd33517ed4f4a695f8bc134b08
            </span>
          </div>
          <Img src={staticFile('explorer.png')} style={{width: '100%', display: 'block'}} />
        </div>
      </AbsoluteFill>

      {/* Only enough falloff to keep the subtitles readable. */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(to top, ${C.ink} 2%, rgba(10,12,14,0.72) 11%, transparent 22%)`,
          pointerEvents: 'none',
        }}
      />

    </AbsoluteFill>
  );
};
