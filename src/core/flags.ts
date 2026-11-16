const REGIONAL_INDICATOR_A = 0x1f1e6;

export function getFlagEmoji(countryCode: string): string {
  const upperCode = countryCode.toUpperCase();
  if (!/^[A-Z]{2}$/.test(upperCode)) {
    return "";
  }
  const codePoints = [...upperCode].map(
    (letter) => REGIONAL_INDICATOR_A + letter.charCodeAt(0) - "A".charCodeAt(0),
  );
  return String.fromCodePoint(...codePoints);
}
