interface IconProps {
  size?: number;
}

function Frame({ size = 24, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const CLOUD = "M7 18h10a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 7 9.5 4.25 4.25 0 0 0 7 18z";

const WEATHER_ICONS: readonly (() => React.ReactNode)[] = [
  () => (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" />
    </>
  ),
  () => <path d={CLOUD} />,
  () => (
    <>
      <path d="M7 14h10a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 7 5.5 4.25 4.25 0 0 0 7 14z" />
      <path d="M8 17l-1 3M12 17l-1 3M16 17l-1 3" />
    </>
  ),
  () => <path d="M3 8h10a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h7a2.5 2.5 0 1 1-2.5 2.5" />,
  () => <path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9" />,
];

const TRIP_ICONS: readonly (() => React.ReactNode)[] = [
  () => <path d="M2 20l7-12 4 6 3-4 6 10z" />,
  () => (
    <>
      <path d="M2 14c4 3 16 3 20 0-4-3-16-3-20 0z" />
      <path d="M7 5l10 10" />
    </>
  ),
  () => (
    <>
      <path d="M2 20 12 5l10 15z" />
      <path d="M9.5 20 12 14l2.5 6" />
    </>
  ),
  () => (
    <>
      <path d="M6 21 17 5" />
      <path d="M13 8c2-3 5-3 8-2-1 3-4 4-6 3" />
    </>
  ),
  () => (
    <>
      <path d="M3 20 21 9M9 5l8 14" />
      <circle cx="15" cy="4.5" r="1.5" />
    </>
  ),
];

export function WeatherIcon({ weather, size }: IconProps & { weather: number }) {
  return <Frame size={size}>{WEATHER_ICONS[weather]()}</Frame>;
}

export function TripIcon({ trip, size }: IconProps & { trip: number }) {
  return <Frame size={size}>{TRIP_ICONS[trip]()}</Frame>;
}

export function QuestionIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <path d="M9 9a3 3 0 1 1 4.5 2.6c-1 .6-1.5 1.2-1.5 2.4M12 17.5v.01" />
    </Frame>
  );
}
