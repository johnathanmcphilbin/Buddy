// Reject invalid ledger data rather than letting NaN bypass affordability checks.
function bitsForEntry(entry) {
  if (entry?.status !== 'Approved') return 0;
  const approved = entry.approvedBits == null ? Math.round(entry.trackedHours) : entry.approvedBits;
  if (!Number.isSafeInteger(approved) || approved < 0) throw new Error('Invalid approved balance');
  return approved;
}

// Each ledger entry records a batch of new hours (not a running total), so
// the account's earned Bits are the sum of every Approved entry's Bits.
export function totalApprovedBits(entries) {
  return entries.reduce((sum, entry) => sum + bitsForEntry(entry), 0);
}

export function availableBits(entries, spent) {
  if (!Number.isFinite(spent) || spent < 0) throw new Error('Invalid spending ledger');
  return Math.max(0, totalApprovedBits(entries) - spent);
}
