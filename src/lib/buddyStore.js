import { writable, derived } from 'svelte/store';

const BITS_KEY = 'buddy-bits';
const UPGRADES_KEY = 'buddy-upgrades';
const DEFAULT_BITS = 7;

function loadBits() {
  if (typeof localStorage === 'undefined') return DEFAULT_BITS;
  const stored = localStorage.getItem(BITS_KEY);
  const parsed = stored !== null ? Number(stored) : NaN;
  return Number.isFinite(parsed) ? parsed : DEFAULT_BITS;
}

function loadUpgrades() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const stored = localStorage.getItem(UPGRADES_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const bits = writable(loadBits());
export const purchasedUpgrades = writable(loadUpgrades());

if (typeof localStorage !== 'undefined') {
  bits.subscribe((value) => localStorage.setItem(BITS_KEY, String(value)));
  purchasedUpgrades.subscribe((value) => localStorage.setItem(UPGRADES_KEY, JSON.stringify(value)));

  window.addEventListener('storage', (event) => {
    if (event.key === BITS_KEY) bits.set(loadBits());
    if (event.key === UPGRADES_KEY) purchasedUpgrades.set(loadUpgrades());
  });
}

// Buddy Level = 1 (base: sees, understands, talks) + one unique upgrade group purchased.
// Buying more than once within the same group, or spending more Bits on a
// bigger version of the same upgrade, never adds an extra level.
export const buddyLevel = derived(purchasedUpgrades, ($purchasedUpgrades) => 1 + $purchasedUpgrades.length);

export function purchaseUpgrade(price, group) {
  let success = false;

  bits.update((current) => {
    if (current < price) return current;
    success = true;
    return current - price;
  });

  if (success && group) {
    purchasedUpgrades.update((list) => (list.includes(group) ? list : [...list, group]));
  }

  return success;
}
