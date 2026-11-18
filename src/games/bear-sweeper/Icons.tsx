interface IconProps {
  size?: number;
}

export function PawIcon({ size = 22 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <ellipse cx="12" cy="16.5" rx="5.2" ry="4.2" />
      <ellipse cx="5.2" cy="10.6" rx="2.1" ry="2.8" />
      <ellipse cx="9.4" cy="6.4" rx="2.1" ry="2.8" />
      <ellipse cx="14.6" cy="6.4" rx="2.1" ry="2.8" />
      <ellipse cx="18.8" cy="10.6" rx="2.1" ry="2.8" />
    </svg>
  );
}

export function PennantIcon({ size = 22 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d="M6 3v18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M7 4.5 19 9.5 7 14.5z" fill="currentColor" />
    </svg>
  );
}
