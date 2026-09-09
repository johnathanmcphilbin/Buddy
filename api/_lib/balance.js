// Reject invalid ledger data rather than letting NaN bypass affordability checks.
export function availableBits(entry, spent) {
  if (!Number.isFinite(spent) || spent < 0) throw new Error('Invalid spending ledger');
  if (entry?.status !== 'Approved') return 0;
  const approved = entry.approvedBits == null ? Math.round(entry.trackedHours) : entry.approvedBits;
  if (!Number.isSafeInteger(approved) || approved < 0) throw new Error('Invalid approved balance');
  return Math.max(0, approved - spent);
}
