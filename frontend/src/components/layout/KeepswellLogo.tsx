// Reusable Keepswell brand mark: ring + serif 'k' + sage olive branch.
// Used in the Header, footer, and anywhere the small brand mark is needed.

interface Props {
  className?: string;
  size?: number;
  /** When true, swap to the coral-filled background variant (matching the iOS app icon). */
  filled?: boolean;
}

export function KeepswellLogo({ className, size, filled = false }: Props) {
  const style = size ? { width: size, height: size } : undefined;

  // Foreground colors for the two variants:
  //   filled  = cream marks on a coral background tile (matches iOS app icon)
  //   unfilled = coral ring + slate 'k' on whatever surface (header use)
  const ringStroke = filled ? '#F6F1EA' : '#D86F5C';
  const kFill = filled ? '#F6F1EA' : '#3C4858';
  const dotFill = filled ? '#F6F1EA' : '#D86F5C';

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

      {/* Ring */}
      <circle
        cx="48"
        cy="51"
        r="32"
        fill="none"
        stroke={ringStroke}
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* Accent dots on ring */}
      <circle cx="78" cy="34" r="2" fill={dotFill} />
      <circle cx="22" cy="72" r="1.6" fill={dotFill} />

      {/* Serif 'k' */}
      <text
        x="48"
        y="65"
        fontFamily="Playfair Display, Didot, Georgia, serif"
        fontSize="44"
        fontWeight={500}
        fill={kFill}
        textAnchor="middle"
      >
        k
      </text>

      {/* Tittle */}
      <circle cx="55" cy="35" r="2.4" fill={kFill} />

      {/* Olive branch — curved stem + 8 pointed leaves alternating sides */}
      <g>
        <path
          d="M 72 36 Q 82 46 86 58 Q 89 70 84 78"
          stroke="#7A8A74"
          strokeWidth="0.6"
          fill="none"
          strokeLinecap="round"
          opacity="0.85"
        />
        {/* Each leaf: pointed teardrop ~7 wide × 2.2 tall, placed by translate+rotate */}
        <g transform="translate(72 34) rotate(-50)">
          <path d="M -3.5 0 Q -2 -1.2 0 -1.2 Q 2 -1.2 3.5 0 Q 2 1.2 0 1.2 Q -2 1.2 -3.5 0 Z" fill="#7A8A74" />
        </g>
        <g transform="translate(76 39) rotate(45)">
          <path d="M -3.5 0 Q -2 -1.2 0 -1.2 Q 2 -1.2 3.5 0 Q 2 1.2 0 1.2 Q -2 1.2 -3.5 0 Z" fill="#7A8A74" opacity="0.9" />
        </g>
        <g transform="translate(81 45) rotate(-25)">
          <path d="M -4 0 Q -2.2 -1.3 0 -1.3 Q 2.2 -1.3 4 0 Q 2.2 1.3 0 1.3 Q -2.2 1.3 -4 0 Z" fill="#7A8A74" />
        </g>
        <g transform="translate(83 51) rotate(55)">
          <path d="M -3.5 0 Q -2 -1.2 0 -1.2 Q 2 -1.2 3.5 0 Q 2 1.2 0 1.2 Q -2 1.2 -3.5 0 Z" fill="#7A8A74" opacity="0.9" />
        </g>
        <g transform="translate(86 57) rotate(-10)">
          <path d="M -4 0 Q -2.2 -1.4 0 -1.4 Q 2.2 -1.4 4 0 Q 2.2 1.4 0 1.4 Q -2.2 1.4 -4 0 Z" fill="#7A8A74" />
        </g>
        <g transform="translate(87 64) rotate(60)">
          <path d="M -3.5 0 Q -2 -1.2 0 -1.2 Q 2 -1.2 3.5 0 Q 2 1.2 0 1.2 Q -2 1.2 -3.5 0 Z" fill="#7A8A74" opacity="0.9" />
        </g>
        <g transform="translate(86 72) rotate(35)">
          <path d="M -3.5 0 Q -2 -1.2 0 -1.2 Q 2 -1.2 3.5 0 Q 2 1.2 0 1.2 Q -2 1.2 -3.5 0 Z" fill="#7A8A74" />
        </g>
        <g transform="translate(83 78) rotate(80)">
          <path d="M -3 0 Q -1.8 -1 0 -1 Q 1.8 -1 3 0 Q 1.8 1 0 1 Q -1.8 1 -3 0 Z" fill="#7A8A74" opacity="0.85" />
        </g>
      </g>
    </svg>
  );
}
