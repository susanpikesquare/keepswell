// Reusable Keepswell brand mark: coral ring + serif 'k' + sage leaves.
// Used in the Header (and anywhere else the small brand mark is needed).

interface Props {
  className?: string;
  size?: number;
  /** When true, swap to filled-coral background variant (matching the iOS app icon). */
  filled?: boolean;
}

export function KeepswellLogo({ className, size, filled = false }: Props) {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-label="Keepswell"
      role="img"
    >
      {filled && <rect width="100" height="100" rx="22" fill="#D86F5C" />}

      {/* Coral ring (or cream if filled) */}
      <circle
        cx="48"
        cy="51"
        r="32"
        fill="none"
        stroke={filled ? '#F6F1EA' : '#D86F5C'}
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Accent dots */}
      <circle cx="78" cy="34" r="2" fill={filled ? '#F6F1EA' : '#D86F5C'} />
      <circle cx="22" cy="72" r="1.6" fill={filled ? '#F6F1EA' : '#D86F5C'} />

      {/* Serif 'k' */}
      <text
        x="48"
        y="65"
        fontFamily="Playfair Display, Didot, Georgia, serif"
        fontSize="44"
        fontWeight={500}
        fill={filled ? '#F6F1EA' : '#3C4858'}
        textAnchor="middle"
      >
        k
      </text>

      {/* Tittle */}
      <circle cx="55" cy="35" r="2.4" fill={filled ? '#F6F1EA' : '#3C4858'} />

      {/* Sage leaves */}
      <g fill="#7A8A74">
        <ellipse cx="76" cy="55" rx="6" ry="2.4" transform="rotate(-25 76 55)" />
        <ellipse cx="70" cy="60" rx="5" ry="2" transform="rotate(15 70 60)" />
        <ellipse
          cx="80"
          cy="48"
          rx="5"
          ry="1.8"
          transform="rotate(-40 80 48)"
          opacity="0.85"
        />
      </g>
    </svg>
  );
}
