type Props = {
  className?: string
  /** Letter-spacing for the wordmark, matching the printed card. */
  tracking?: string
}

/** The clock face that stands in for the first O. */
function ClockO({ tracking }: { tracking: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
      style={{
        width: '0.74em',
        height: '0.74em',
        marginRight: tracking,
        flex: 'none',
      }}
    >
      <circle cx="12" cy="12" r="10.6" strokeWidth="1.3" />
      <path d="M12 12V5.4" strokeWidth="1.3" />
      <path d="M12 12l4.6 3.4" strokeWidth="1.3" />
    </svg>
  )
}

/**
 * MONTIRO exactly as it is printed on the business card: light geometric
 * capitals, wide tracking, first O replaced by a clock face.
 */
export default function Wordmark({ className = '', tracking = '0.26em' }: Props) {
  return (
    <span className={`inline-flex items-center font-extralight ${className}`} aria-label="MONTIRO">
      <span style={{ letterSpacing: tracking }} aria-hidden="true">
        M
      </span>
      <ClockO tracking={tracking} />
      <span style={{ letterSpacing: tracking, marginRight: `-${tracking}` }} aria-hidden="true">
        NTIRO
      </span>
    </span>
  )
}
