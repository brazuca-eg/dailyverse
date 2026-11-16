function toLinear(channel: number): number {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function measureLuminance(hex: string): number {
  const digits = hex.replace("#", "");
  const [red, green, blue] = [0, 2, 4].map((start) =>
    toLinear(parseInt(digits.slice(start, start + 2), 16)),
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function calculateContrast(first: string, second: string): number {
  const [light, dark] = [measureLuminance(first), measureLuminance(second)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}
