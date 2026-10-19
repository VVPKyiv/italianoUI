export function WhiteMagicGlow() {
  return <span className="journey-magic" aria-hidden="true"><i /><i /><i /><i /><i /></span>;
}

export function ItalianProgressBar({ value, total }: { value: number; total: number }) {
  const percentage = total > 0 ? Math.min(100, Math.max(0, value / total * 100)) : 0;
  return <span className="journey-progress" aria-hidden="true"><i style={{ width: `${percentage}%` }} /></span>;
}
