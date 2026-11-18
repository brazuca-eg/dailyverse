export function modulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}
