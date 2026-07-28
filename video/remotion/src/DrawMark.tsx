import {interpolate, useCurrentFrame, Easing} from 'remotion';
import {C, EASE_IN} from './theme';

const ease = Easing.bezier(...(EASE_IN as unknown as [number, number, number, number]));

const OUTER = ['M6 13H58', 'M6 21H58', 'M6 29H58', 'M6 37H58', 'M6 45H58', 'M6 53H58'];
const INNER = ['M2 17H62', 'M2 25H62', 'M2 33H62', 'M2 41H62', 'M2 49H62'];

/**
 * The mark drawing itself, line by line, with the displaced set arriving last so
 * the diamond resolves out of interference rather than fading up complete.
 *
 * `stroke-dashoffset` is the one property beyond transform and opacity worth
 * animating: it is what makes a line read as being drawn instead of revealed.
 */
export const DrawMark: React.FC<{size?: number; start?: number; color?: string}> = ({
  size = 78,
  start = 0,
  color = C.bone,
}) => {
  const f = useCurrentFrame() - start;
  const id = `dm${size}`;
  const w = size > 60 ? 1.6 : 2.4;

  const draw = (i: number, delay: number) => {
    const t = interpolate(f, [delay, delay + 16], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: ease,
    });
    return {strokeDasharray: 64, strokeDashoffset: 64 * (1 - t)};
  };

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
      <g stroke={color} strokeWidth={w} strokeLinecap="square">
        <g mask={`url(#${id}o)`} opacity="0.28">
          {OUTER.map((d, i) => (
            <path key={d} d={d} style={draw(i, i * 4)} />
          ))}
        </g>
        <g clipPath={`url(#${id}i)`}>
          {INNER.map((d, i) => (
            <path key={d} d={d} style={draw(i, 26 + i * 5)} />
          ))}
        </g>
      </g>
    </svg>
  );
};
