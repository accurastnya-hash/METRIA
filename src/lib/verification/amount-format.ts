export function formatTokenAmountFlow(raw: string | null, decimals: number): string {
  if (!raw) return 'Historical change unavailable';
  const match = raw.match(/^(\d+) out \/ (\d+) in$/);
  if (!match) return raw;
  const format = (units: string) => {
    const n = BigInt(units);
    const scale = BigInt(10) ** BigInt(decimals);
    const whole = n / scale;
    const fraction = (n % scale).toString().padStart(decimals, '0').replace(/0+$/, '');
    return fraction ? `${whole}.${fraction}` : whole.toString();
  };
  return `${format(match[1])} out / ${format(match[2])} in (${decimals} decimals) · raw ${raw}`;
}
