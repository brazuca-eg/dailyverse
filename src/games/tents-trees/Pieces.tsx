interface PieceProps {
  size?: number;
}

export function TreePiece({ size = 28 }: PieceProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" focusable="false">
      <rect x="14" y="23" width="4" height="7" fill="#7a5230" />
      <polygon points="16,3 25,14 7,14" fill="#2f7d57" />
      <polygon points="16,9 27,21 5,21" fill="#2a6f4d" />
    </svg>
  );
}

export function TentPiece({ size = 28 }: PieceProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" focusable="false">
      <polygon points="2,28 30,28 16,5" fill="#e07a3f" />
      <polygon points="12,28 20,28 16,16" fill="#a8531f" />
      <rect x="15" y="2" width="2" height="5" fill="#7a5230" />
    </svg>
  );
}

export function GrassPiece({ size = 28 }: PieceProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" focusable="false">
      <path
        d="M9 26 C9 20 10 17 8 13 M16 26 C16 18 17 14 16 9 M23 26 C23 20 22 17 24 13"
        fill="none"
        stroke="#4f9a4a"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
