const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E\")"

type Props = {
  className?: string
  /** Horizontal position of the key light, as a CSS percentage. */
  keyLight?: string
}

/**
 * Product-shot lighting: one soft key light behind the piece, a cold rim on
 * the far side, a heavy vignette and fine grain. Near-black, but never flat.
 */
export default function StudioBackdrop({ className = '', keyLight = '68%' }: Props) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[#0C0D10]" />

      {/* key light */}
      <div
        className="absolute inset-0"
        style={{
          background:
            `radial-gradient(52% 46% at ${keyLight} 44%, rgba(214,222,232,0.14), transparent 68%),` +
            'radial-gradient(60% 44% at 18% 12%, rgba(160,172,188,0.07), transparent 70%)',
          filter: 'blur(18px)',
        }}
      />

      {/* cold rim along the floor */}
      <div
        className="absolute inset-x-0 bottom-0 h-[42%]"
        style={{
          background:
            'linear-gradient(to top, rgba(150,166,186,0.07), transparent 78%)',
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.055] mix-blend-overlay"
        style={{ backgroundImage: GRAIN, backgroundRepeat: 'repeat' }}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(110% 92% at 50% 44%, transparent 32%, rgba(0,0,0,0.78) 100%)',
        }}
      />
    </div>
  )
}
