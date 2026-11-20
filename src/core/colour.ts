const LIGHTNESS_PER_SHADE = 0.03;

interface Hsl {
  hue: number;
  saturation: number;
  lightness: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function parseHex(hex: string): [number, number, number] {
  const digits = hex.replace("#", "");
  return [0, 2, 4].map((start) => parseInt(digits.slice(start, start + 2), 16) / 255) as [
    number,
    number,
    number,
  ];
}

function findHue(red: number, green: number, blue: number, max: number, delta: number): number {
  if (max === red) {
    return ((green - blue) / delta + 6) % 6;
  }
  return max === green ? (blue - red) / delta + 2 : (red - green) / delta + 4;
}

function toHsl([red, green, blue]: [number, number, number]): Hsl {
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  const delta = max - min;
  if (delta === 0) {
    return { hue: 0, saturation: 0, lightness };
  }
  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  return { hue: findHue(red, green, blue, max, delta) * 60, saturation, lightness };
}

function fromHsl({ hue, saturation, lightness }: Hsl): [number, number, number] {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const channel = (offset: number) => {
    const position = (offset + hue / 30) % 12;
    return lightness - (chroma / 2) * Math.max(-1, Math.min(position - 3, 9 - position, 1));
  };
  return [channel(0), channel(8), channel(4)];
}

function toHex(channels: [number, number, number]): string {
  return `#${channels
    .map((channel) =>
      Math.round(clamp(channel, 0, 1) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

export function shadeColour(hex: string, shade: number): string {
  const hsl = toHsl(parseHex(hex));
  const lightness = clamp(hsl.lightness + shade * LIGHTNESS_PER_SHADE, 0, 1);
  return toHex(fromHsl({ ...hsl, lightness }));
}

export function mixColours(first: string, second: string, share: number): string {
  const [one, two] = [parseHex(first), parseHex(second)];
  return toHex(
    one.map((channel, index) => channel + (two[index] - channel) * share) as [
      number,
      number,
      number,
    ],
  );
}

export function toGreyColour(hex: string): string {
  const [red, green, blue] = parseHex(hex);
  const grey = 0.299 * red + 0.587 * green + 0.114 * blue;
  return toHex([grey, grey, grey]);
}
