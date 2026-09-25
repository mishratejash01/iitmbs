/** A study sheet with a download arrow, drawn in the theme highlights. Decorative only. */
export function DownloadIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 280 300" aria-hidden="true" focusable="false" className={className}>
      <circle cx="148" cy="164" r="116" fill="var(--lime)" />
      <circle cx="42" cy="70" r="16" fill="var(--sky)" />
      <g transform="rotate(-9 140 160)">
        <path
          d="M72 42h108l40 40v168a14 14 0 0 1-14 14H72a14 14 0 0 1-14-14V56a14 14 0 0 1 14-14z"
          fill="var(--card)"
          stroke="var(--accent-strong)"
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <path
          d="M180 42v28a12 12 0 0 0 12 12h28"
          fill="var(--accent-soft)"
          stroke="var(--accent-strong)"
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <rect x="82" y="72" width="70" height="9" rx="4.5" fill="var(--violet)" />
        <rect x="82" y="92" width="112" height="9" rx="4.5" fill="var(--accent-soft)" />
        <path
          d="M139 118v74m-32-32 32 32 32-32"
          fill="none"
          stroke="var(--accent-strong)"
          strokeWidth="22"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M139 118v74m-32-32 32 32 32-32"
          fill="none"
          stroke="var(--violet)"
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="94" y="222" width="90" height="12" rx="6" fill="var(--green)" />
      </g>
      <g transform="rotate(10 222 232)">
        <rect
          x="184"
          y="212"
          width="78"
          height="40"
          rx="20"
          fill="var(--sun)"
          stroke="var(--accent-strong)"
          strokeWidth="4"
        />
        <text
          x="223"
          y="238"
          textAnchor="middle"
          fontSize="17"
          fontWeight="700"
          fill="var(--accent-strong)"
        >
          PYQ
        </text>
      </g>
    </svg>
  )
}
