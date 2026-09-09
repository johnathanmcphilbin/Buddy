import { writable, derived } from 'svelte/store';

const UPGRADES_KEY = 'buddy-upgrades';

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

export const bits = writable(0);
export const purchasedUpgrades = writable(loadUpgrades());

if (typeof localStorage !== 'undefined') {
  purchasedUpgrades.subscribe((value) => localStorage.setItem(UPGRADES_KEY, JSON.stringify(value)));

  window.addEventListener('storage', (event) => {
    if (event.key === UPGRADES_KEY) purchasedUpgrades.set(loadUpgrades());
  });
}

// Buddy Level = 1 (base: sees, understands, talks) + one unique upgrade group purchased.
// Buying more than once within the same group, or spending more Bits on a
// bigger version of the same upgrade, never adds an extra level.
export const buddyLevel = derived(purchasedUpgrades, ($purchasedUpgrades) => 1 + $purchasedUpgrades.length);
