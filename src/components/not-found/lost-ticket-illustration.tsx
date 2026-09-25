/**
 * A hall ticket that went astray: roll number 404, a "not found" stamp and a
 * paper plane that flew off. Drawn in the theme highlights like the home page
 * illustrations. Decorative only.
 */
export function LostTicketIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 300" aria-hidden="true" focusable="false" className={className}>
      <circle cx="176" cy="160" r="118" fill="var(--lime)" />
      <circle cx="56" cy="66" r="14" fill="var(--sky)" />
      <circle cx="292" cy="58" r="9" fill="var(--sun)" />

      {/* The paper plane that got away. */}
      <path
        d="M52 262c-26-30 6-58-6-92"
        fill="none"
        stroke="var(--accent-strong)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="2 9"
      />
      <path
        d="M30 150l40-26-10 44-9-13z"
        fill="var(--card)"
        stroke="var(--accent-strong)"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path d="M70 124l-19 31" stroke="var(--accent-strong)" strokeWidth="3" />

      <g transform="rotate(-7 170 156)">
        <rect
          x="80"
          y="56"
          width="196"
          height="202"
          rx="18"
          fill="var(--card)"
          stroke="var(--accent-strong)"
          strokeWidth="5"
        />
        <path
          d="M98 56h160a18 18 0 0 1 18 18v28H80V74a18 18 0 0 1 18-18z"
          fill="var(--violet)"
          stroke="var(--accent-strong)"
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <text
          x="178"
          y="86"
          textAnchor="middle"
          fontSize="15"
          fontWeight="700"
          letterSpacing="2.5"
          fill="var(--accent-strong)"
        >
          HALL TICKET
        </text>

        <rect
          x="100"
          y="120"
          width="58"
          height="68"
          rx="10"
          fill="var(--accent-soft)"
          stroke="var(--accent-strong)"
          strokeWidth="4"
        />
        <text
          x="129"
          y="167"
          textAnchor="middle"
          fontSize="40"
          fontWeight="700"
          fill="var(--accent-strong)"
        >
          ?
        </text>

        <text
          x="174"
          y="132"
          fontSize="11"
          fontWeight="700"
          letterSpacing="1.5"
          fill="var(--text-muted)"
        >
          ROLL NO.
        </text>
        <text x="172" y="172" fontSize="40" fontWeight="800" fill="var(--accent-strong)">
          404
        </text>

        <rect x="100" y="206" width="156" height="9" rx="4.5" fill="var(--accent-soft)" />
        <rect x="100" y="225" width="104" height="9" rx="4.5" fill="var(--accent-soft)" />
      </g>

      <g transform="rotate(14 262 232)">
        <circle
          cx="262"
          cy="232"
          r="38"
          fill="var(--sun)"
          stroke="var(--accent-strong)"
          strokeWidth="4"
        />
        <circle
          cx="262"
          cy="232"
          r="29"
          fill="none"
          stroke="var(--accent-strong)"
          strokeWidth="2"
          strokeDasharray="3 5"
        />
        <text
          x="262"
          y="229"
          textAnchor="middle"
          fontSize="12"
          fontWeight="800"
          letterSpacing="1"
          fill="var(--accent-strong)"
        >
          NOT
        </text>
        <text
          x="262"
          y="244"
          textAnchor="middle"
          fontSize="12"
          fontWeight="800"
          letterSpacing="1"
          fill="var(--accent-strong)"
        >
          FOUND
        </text>
      </g>
    </svg>
  )
}
