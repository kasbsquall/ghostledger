import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {C} from './theme';

/**
 * The film measured under 8% ink on every single frame and read as a void.
 * A flat fill has no information in it, so the eye finds nothing to hold and
 * the whole picture reads as underexposed regardless of its actual luminance.
 *
 * This is the fix: a faint rule grid that gives the frame structure, a lifted
 * field so the ground is a surface rather than an absence, and grain so the
 * flat areas are not mathematically flat. None of it is legible on its own,
 * which is the point.
 */
export const Ground: React.FC<{tone?: 'neutral' | 'warm' | 'cool'}> = ({tone = 'neutral'}) => {
  const f = useCurrentFrame();

  // Very slow drift so the texture is never mathematically static.
  const shift = interpolate(f % 1800, [0, 1800], [0, 40]);

  const wash =
    tone === 'warm'
      ? 'rgba(196,150,74,0.115)'
      : tone === 'cool'
        ? 'rgba(153,163,171,0.05)'
        : 'rgba(196,206,214,0.10)';

  return (
    <AbsoluteFill style={{background: '#0d1116', pointerEvents: 'none'}}>
      {/* A lifted field, so the ground is a surface and not an absence. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(120% 90% at 50% 38%, ${wash} 0%, transparent 68%)`,
        }}
      />

      {/* Structure. 96px rules at 3% alpha: invisible as lines, load-bearing as
          a grid the composition can sit on. */}
      <AbsoluteFill
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(232,234,231,0.028) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(232,234,231,0.022) 1px, transparent 1px)
          `,
          backgroundSize: '96px 96px',
          transform: `translateX(${-shift}px)`,
          maskImage: 'radial-gradient(130% 100% at 50% 40%, #000 0%, transparent 78%)',
          WebkitMaskImage: 'radial-gradient(130% 100% at 50% 40%, #000 0%, transparent 78%)',
        }}
      />

      {/*
        DITHER, not decoration. Measured: the background gradients were landing
        on 13 distinct grey levels across the whole frame, because a radial that
        travels ~7 luminance values over a thousand pixels has nowhere to put
        the in-between steps. Each step edge is a visible contour, and that
        contouring is what reads as a burnt, low-quality background.

        The earlier grain used `mixBlendMode: overlay`, which on near-black
        pixels contributes almost nothing, so it looked like texture and did no
        work. Plain alpha at a low value adds roughly one or two levels of
        amplitude, which is exactly enough to break a contour into noise the eye
        integrates back into a smooth ramp.
      */}
      <AbsoluteFill
        style={{
          opacity: 0.5,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='d'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='1' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='linear' slope='0.13'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23d)'/%3E%3C/svg%3E\")",
          backgroundSize: '120px 120px',
        }}
      />
    </AbsoluteFill>
  );
};
