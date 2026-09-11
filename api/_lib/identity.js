// Stops a different Hackatime account from claiming someone else's email
// (and therefore their balance) later, using data Buddy already writes to
// Airtable — no new field, no Redis, no extra infrastructure. Every ledger
// row already records the submitter's Hackatime Username alongside their
// email, so an email only "belongs" to the account whose username shows up
// on its prior rows; a brand-new email has no rows yet and is open to
// whoever uses it first (in practice: whoever submits with it first, since
// merely saving a contact email doesn't create a ledger row).
export function emailOwnedByOther(priorEntries, hackatimeUsername) {
  return priorEntries.some((entry) => entry.hackatimeUsername && entry.hackatimeUsername !== hackatimeUsername);
}
