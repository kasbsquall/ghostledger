import React from 'react';
import {interpolate, useCurrentFrame, Easing} from 'remotion';
import {C, FONT, MONO, EASE_IN} from './theme';

const ease = Easing.bezier(...(EASE_IN as unknown as [number, number, number, number]));

/** Decelerates in and holds. Delay is in frames, local to the scene. */
export function useRise(delay = 0, dur = 13) {
  const f = useCurrentFrame();
  const t = interpolate(f, [delay, delay + dur], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });
  return {opacity: t, transform: `translateY(${(1 - t) * 8}px)`};
}

/**
 * The GhostLedger mark. One set of parallel lines; inside the diamond they sit
 * at a different offset and the shape emerges from the difference alone.
 */
export const Mark: React.FC<{size?: number; color?: string}> = ({
  size = 40,
  color = C.bone,
}) => {
  const id = `m${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <clipPath id={`${id}i`}>
          <path d="M32 10 L54 32 L32 54 L10 32 Z" />
        </clipPath>
        <mask id={`${id}o`}>
          <rect width="64" height="64" fill="#fff" />
          <path d="M32 10 L54 32 L32 54 L10 32 Z" fill="#000" />
        </mask>
      </defs>
      <g stroke={color} strokeWidth={size > 60 ? 1.6 : 2.4} strokeLinecap="square">
        <g mask={`url(#${id}o)`} opacity="0.28">
          <path d="M6 13H58M6 21H58M6 29H58M6 37H58M6 45H58M6 53H58" />
        </g>
        <g clipPath={`url(#${id}i)`}>
          <path d="M2 17H62M2 25H62M2 33H62M2 41H62M2 49H62" />
        </g>
      </g>
    </svg>
  );
};

type Band = 'clear' | 'watch' | 'flag';

const BAND_LABEL: Record<Band, string> = {
  clear: 'Within pattern',
  watch: 'Review',
  flag: 'Anomalous',
};

export const RiskBadge: React.FC<{band: Band; scale?: number}> = ({band, scale = 1}) => {
  const tone = {clear: C.clear, watch: C.watch, flag: C.flag}[band];
  const wash = {clear: C.clearWash, watch: C.watchWash, flag: C.flagWash}[band];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8 * scale,
        padding: `${6 * scale}px ${14 * scale}px`,
        borderRadius: 3,
        background: wash,
        color: tone,
        fontFamily: FONT.text,
        fontSize: 19 * scale,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      <i
        style={{
          width: 7 * scale,
          height: 7 * scale,
          borderRadius: '50%',
          background: tone,
          flex: '0 0 auto',
        }}
      />
      {BAND_LABEL[band]}
    </span>
  );
};

/** A soft pool of light behind the one thing that matters in a scene. */
export const Glow: React.FC<{
  color?: string;
  size?: number;
  x?: string;
  y?: string;
  opacity?: number;
}> = ({color = C.bone, size = 900, x = '50%', y = '50%', opacity = 0.07}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: size,
      height: size,
      marginLeft: -size / 2,
      marginTop: -size / 2,
      borderRadius: '50%',
      background: `radial-gradient(circle, ${color} 0%, transparent 68%)`,
      opacity,
      pointerEvents: 'none',
    }}
  />
);

export const Kicker: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({
  children,
  style,
}) => (
  <span
    style={{
      fontFamily: MONO,
      fontSize: 15,
      fontWeight: 300,
      letterSpacing: '0.2em',
      textTransform: 'uppercase',
      color: C.mute,
      ...style,
    }}
  >
    {children}
  </span>
);

export const Headline: React.FC<{
  children: React.ReactNode;
  size?: number;
  style?: React.CSSProperties;
}> = ({children, size = 76, style}) => (
  <h1
    style={{
      margin: 0,
      fontFamily: FONT.display,
      fontWeight: 600,
      fontSize: size,
      lineHeight: 1.02,
      letterSpacing: size > 64 ? '-0.035em' : '-0.028em',
      color: C.bone,
      textWrap: 'balance',
      ...style,
    }}
  >
    {children}
  </h1>
);

/** Numbers are always tabular. A column that reflows as it updates reads as noise. */
export const num: React.CSSProperties = {
  fontFamily: MONO,
  fontVariantNumeric: 'tabular-nums lining-nums slashed-zero',
  letterSpacing: '-0.01em',
};
