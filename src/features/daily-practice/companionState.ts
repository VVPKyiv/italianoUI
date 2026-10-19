export type CompanionPosition = { x: number; y: number };

export function clampCompanion(position: CompanionPosition, width: number, height: number): CompanionPosition {
  return { x: Math.max(8, Math.min(position.x, width - 128)), y: Math.max(Math.min(128, Math.max(8, height - 186)), Math.min(position.y, height - 186)) };
}

export function goalTransition(previous: { date: string; complete: boolean } | undefined, current: { date: string; complete: boolean }) {
  // Opening a completed day or switching profiles is not a newly earned celebration.
  return Boolean(previous && previous.date === current.date && !previous.complete && current.complete);
}
