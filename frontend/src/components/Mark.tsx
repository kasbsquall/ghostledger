/**
 * The GhostLedger mark, "Interferencia".
 *
 * One set of parallel lines. Inside the diamond region they sit at a different
 * offset, and the shape emerges from that difference alone. Nothing draws the
 * diamond, which is the point: the form exists only because two layers
 * disagree, the same way a handle only means something to whoever can resolve
 * it. The lines animate into their offset on mount.
 */
export function Mark({ size = 32, animate = false }: { size?: number; animate?: boolean }) {
  const id = `mk${size}${animate ? 'a' : ''}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      role="img"
      aria-label="GhostLedger"
      className={animate ? 'mark mark--animate' : 'mark'}
    >
      <defs>
        <clipPath id={`${id}-in`}>
          <path d="M32 10 L54 32 L32 54 L10 32 Z" />
        </clipPath>
        <mask id={`${id}-out`}>
          <rect width="64" height="64" fill="#fff" />
          <path d="M32 10 L54 32 L32 54 L10 32 Z" fill="#000" />
        </mask>
      </defs>

      <g stroke="currentColor" strokeWidth={size > 40 ? 1.2 : 1.8} strokeLinecap="square">
        <g mask={`url(#${id}-out)`} opacity="0.45">
          <path d="M6 13H58M6 21H58M6 29H58M6 37H58M6 45H58M6 53H58" />
        </g>
        <g clipPath={`url(#${id}-in)`} className="mark__inner">
          <path d="M2 17H62M2 25H62M2 33H62M2 41H62M2 49H62" />
        </g>
      </g>
    </svg>
  );
}
