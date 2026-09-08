<script>
  import { onMount } from 'svelte';
  import RoughFrame from './lib/RoughFrame.svelte';
  import { bits, buddyLevel, purchasedUpgrades } from './lib/buddyStore.js';

  const categories = ['ALL', 'EYES', 'BRAIN', 'VOICE', 'WORLD'];

  const branches = [
    {
      key: 'EYES',
      accent: '#ec3750',
      icon: 'eyes',
      items: [
        {
          id: 'better-eyes',
          title: 'Give Buddy Better Eyes',
          item: 'Logitech C270 Webcam',
          price: 8,
          reason: 'Point Buddy somewhere your laptop can’t.',
          build: 'Point Buddy at your desk, doorway, shelf, or anywhere your laptop can’t.',
          group: 'better-eyes'
        },
        {
          id: 'better-lighting',
          title: 'Better Lighting',
          item: 'USB Desk Light',
          price: 6,
          reason: 'Give Buddy cleaner training photos and more reliable detections.',
          build: 'Make your detector work better in messy rooms or darker spaces.',
          group: null
        },
        {
          id: 'better-vision',
          title: 'Give Buddy Better Vision',
          item: 'Roboflow Credits',
          price: 2,
          reason: 'Train more, test more, and keep improving your detector.',
          build: 'Train more versions of your detector and compare what works best.',
          group: 'better-vision'
        }
      ]
    },
    {
      key: 'BRAIN',
      accent: '#ff8c37',
      icon: 'brain',
      items: [
        {
          id: 'brain-10',
          title: 'Give Buddy a Brain',
          item: '$10 AI Credit Grant',
          price: 2,
          reason: 'Replace fixed responses with generated ones.',
          build: 'Let Buddy come up with its own responses instead of using fixed sentences.',
          group: 'brain'
        },
        {
          id: 'brain-25',
          title: 'Give Buddy a Bigger Brain',
          item: '$25 AI Credit Grant',
          price: 5,
          reason: 'Take Buddy further with generated responses and smarter behavior.',
          build: 'Add more personality, better responses, or more advanced assistant behavior.',
          group: 'brain'
        },
        {
          id: 'memory',
          title: 'Give Buddy a Memory',
          item: 'Database / Storage Credit Grant',
          price: 3,
          reason: 'Let Buddy remember what happened earlier instead of only reacting to the current frame.',
          build: 'Make Buddy remember routines, past detections, or what you usually forget.',
          group: 'memory'
        },
        {
          id: 'training-power',
          title: 'Train Buddy Properly',
          item: 'Roboflow Core',
          price: 20,
          reason: 'For when you want to seriously keep building the vision side.',
          build: 'Push the vision side further with more serious training and testing.',
          group: 'training-power'
        }
      ]
    },
    {
      key: 'VOICE',
      accent: '#338eda',
      icon: 'voice',
      items: [
        {
          id: 'ears',
          title: 'Give Buddy Ears',
          item: 'USB Microphone',
          price: 7,
          reason: 'Let Buddy react to what it hears as well as what it sees.',
          build: 'Build a Buddy that listens for commands while also watching what is happening.',
          group: 'ears'
        },
        {
          id: 'custom-voice',
          title: 'Give Buddy a Voice',
          item: 'ElevenLabs Voice Creator',
          price: 3,
          reason: 'Create a custom voice that sounds exactly how you want your Buddy to sound.',
          build: 'Give Buddy its own personality with a voice you designed just for it.',
          group: 'custom-voice'
        }
      ]
    },
    {
      key: 'WORLD',
      accent: '#33d6a6',
      icon: 'world',
      items: [
        {
          id: 'body',
          title: 'Give Buddy a Body',
          item: '$25 Hardware Grant',
          price: 5,
          reason: 'Buy LEDs, servos, buttons, displays, or whatever lets Buddy affect the real world.',
          build: 'Make Buddy light something up, move something, or control something physical.',
          group: 'body'
        },
        {
          id: 'face',
          title: 'Give Buddy a Face',
          item: 'Small Display Grant',
          price: 8,
          reason: 'Put Buddy’s status, expressions, or responses on a physical screen.',
          build: 'Give Buddy a little face that changes depending on what it sees.',
          group: 'face'
        },
        {
          id: 'more-senses',
          title: 'Give Buddy More Senses',
          item: 'Sensor Hardware Grant',
          price: 5,
          reason: 'Add things like light, distance, temperature, or motion sensing.',
          build: 'Make Buddy react to the room, not just what the camera sees.',
          group: 'more-senses'
        }
      ]
    }
  ];

  let hoursBuilt = 0;

  let activeCategory = 'ALL';
  let selectedItem = null;
  let hackatimeConnected = false;
  let isClaiming = false;
  let claimError = '';

  // The real Bit balance = Airtable's review ledger minus everything
  // already claimed in the shop — never calculated or adjusted locally.
  async function loadBalance() {
    try {
      const response = await fetch('/api/bits/status');
      const data = await response.json();
      hackatimeConnected = data.status !== 'Not connected';
      if (typeof data.balance === 'number') {
        bits.set(data.balance);
      }
      if (typeof data.trackedHours === 'number') {
        hoursBuilt = data.trackedHours;
      }
    } catch {
      // Leave the locally stored balance as-is if the ledger can't be reached.
    }
  }

  onMount(loadBalance);

  $: visibleBranches = branches.filter((branch) => activeCategory === 'ALL' || branch.key === activeCategory);

  function openClaim(item) {
    if (!hackatimeConnected) {
      window.location.href = '/#hackatime';
      return;
    }
    claimError = '';
    selectedItem = item;
  }

  function closeModal() {
    selectedItem = null;
    claimError = '';
  }

  async function confirmClaim() {
    if (!selectedItem) return;

    isClaiming = true;
    claimError = '';

    try {
      const response = await fetch('/api/shop/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: selectedItem.id })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Could not claim this upgrade right now.');

      if (!data.claimed) {
        claimError = data.error || 'You need more Bits for this upgrade.';
        if (typeof data.balance === 'number') bits.set(data.balance);
        return;
      }

      bits.set(data.balance);
      if (data.group) purchasedUpgrades.update((list) => (list.includes(data.group) ? list : [...list, data.group]));
      selectedItem = null;
    } catch (error) {
      claimError = error.message;
    } finally {
      isClaiming = false;
    }
  }
</script>

<header class="site-header">
  <a class="brand-lockup" href="/">
    <img src="/images/hackclub-flag.svg" alt="Hack Club" />
    <span>Buddy</span>
  </a>
  <nav aria-label="Primary">
    <a href="/">Back to Buddy</a>
    <a href="/submit.html">Submit</a>
  </nav>
</header>

<main class="shop-page">
  <section class="shop-top">
    <div class="section-shell shop-top-shell">
      <p class="eyebrow">BUDDY SHOP</p>
      <h1>Upgrade your Buddy.</h1>
      <p class="shop-subhead">Every hour you build earns you 1 Bit. Spend your Bits on things that make Buddy see, think, hear, and do more.</p>

      <p class="shop-rate">1 HOUR = 1 BIT</p>
      <p class="shop-tracking">Tracked with Lapse and Hackatime.</p>

      <div class="balance-readout">
        <RoughFrame stroke="#26324d" fill="#fffdf6" seed={12} radius={22} roughness={2}>
          <span class="balance-label">YOUR BALANCE</span>
          <span class="balance-amount">{$bits} BITS</span>
          <span class="balance-line">{hoursBuilt.toFixed(1)} hours built</span>
        </RoughFrame>
      </div>

      <div class="level-indicator">
        <span class="level-indicator-label">BUDDY LEVEL</span>
        <span class="level-indicator-value">LEVEL {$buddyLevel}</span>
      </div>

      <nav class="category-nav" aria-label="Shop categories">
        {#each categories as category}
          <button
            type="button"
            class="category-pill"
            class:active={activeCategory === category}
            on:click={() => (activeCategory = category)}
          >
            {category}
          </button>
        {/each}
      </nav>
    </div>
  </section>

  <section class="shop-tree-section">
    <div class="section-shell">
      <div class="shop-tree">
        <div class="buddy-node">
          <RoughFrame stroke="#26324d" fill="#ffffff" seed={5} radius={28} roughness={1.8}>
            <span class="buddy-node-label">BUDDY</span>
          </RoughFrame>
        </div>

        <div class="branch-row">
          {#each visibleBranches as branch (branch.key)}
            <div class="branch">
              <svg class="branch-connector" viewBox="0 0 20 60" aria-hidden="true">
                <path
                  d="M10 2 C 8 16, 12 24, 10 38 C 8 48, 11 52, 10 58"
                  fill="none"
                  stroke={branch.accent}
                  stroke-width="2.4"
                  stroke-linecap="round"
                />
              </svg>

              <div class="branch-header">
                <span class="branch-icon" style={`--accent:${branch.accent}`}>
                  {#if branch.icon === 'eyes'}
                    <svg viewBox="0 0 32 32" aria-hidden="true">
                      <path d="M3 16c4-7 22-7 26 0-4 7-22 7-26 0Z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" />
                      <circle cx="16" cy="16" r="4.5" fill="none" stroke="currentColor" stroke-width="2.2" />
                    </svg>
                  {:else if branch.icon === 'brain'}
                    <svg viewBox="0 0 32 32" aria-hidden="true">
                      <path
                        d="M12 5c-4 0-6 3-5.6 6.2C4.4 12.4 4 15 6 16.8c-1 2 0 4.6 2.6 5.4C9 24.4 11 26 13.5 26c1.2 0 2-.5 2.5-1.2M20 5c4 0 6 3 5.6 6.2 2 1.2 2.4 3.8.4 5.6 1 2 0 4.6-2.6 5.4C23 24.4 21 26 18.5 26c-1.2 0-2-.5-2.5-1.2M16 6v18"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  {:else if branch.icon === 'voice'}
                    <svg viewBox="0 0 32 32" aria-hidden="true">
                      <rect x="12" y="4" width="8" height="16" rx="4" fill="none" stroke="currentColor" stroke-width="2.2" />
                      <path d="M8 16c0 4.4 3.6 8 8 8s8-3.6 8-8M16 24v4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
                    </svg>
                  {:else}
                    <svg viewBox="0 0 32 32" aria-hidden="true">
                      <circle cx="16" cy="16" r="11" fill="none" stroke="currentColor" stroke-width="2.2" />
                      <path d="M5 16h22M16 5c3.5 3 3.5 19 0 22M16 5c-3.5 3-3.5 19 0 22" fill="none" stroke="currentColor" stroke-width="2" />
                    </svg>
                  {/if}
                </span>
                <h2>{branch.key}</h2>
              </div>

              <div class="branch-items">
                {#each branch.items as upgrade}
                  <article class="upgrade-card">
                    <RoughFrame stroke={branch.accent} fill="#ffffff" seed={upgrade.price + 20} radius={20} roughness={2}>
                      <div class="upgrade-inner">
                        <h3>{upgrade.title}</h3>
                        <p class="upgrade-item">{upgrade.item}</p>
                        <span class="upgrade-price" style={`--accent:${branch.accent}`}>{upgrade.price} BITS</span>
                        <p class="upgrade-reason">{upgrade.reason}</p>

                        <button type="button" class="button claim-button" style={`--accent:${branch.accent}`} on:click={() => openClaim(upgrade)}>
                          CLAIM UPGRADE
                        </button>

                        <div class="upgrade-build">
                          <span class="upgrade-build-label">WHAT COULD I BUILD WITH THIS?</span>
                          <p>{upgrade.build}</p>
                        </div>
                      </div>
                    </RoughFrame>
                  </article>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </section>
</main>

{#if selectedItem}
  <div class="modal-backdrop" role="presentation" on:click={closeModal}>
    <div class="modal-panel" role="dialog" aria-modal="true" on:click|stopPropagation>
      <RoughFrame stroke="#26324d" fill="#fffdf6" seed={77} radius={24} roughness={1.9}>
        {#if claimError}
          <div class="modal-inner">
            <h3>{claimError}</h3>
            <div class="modal-actions">
              <button type="button" class="button secondary-button" on:click={closeModal}>KEEP BUILDING</button>
            </div>
          </div>
        {:else if $bits >= selectedItem.price}
          <div class="modal-inner">
            <h3>Spend {selectedItem.price} Bits?</h3>
            <p>This will use {selectedItem.price} of your {$bits} earned Bits.</p>
            <p>You’ll have {$bits - selectedItem.price} Bits left.</p>
            <div class="modal-actions">
              <button type="button" class="button quiet-button" on:click={closeModal} disabled={isClaiming}>NEVER MIND</button>
              <button type="button" class="button secondary-button" on:click={confirmClaim} disabled={isClaiming}>
                {isClaiming ? 'Claiming…' : 'CLAIM UPGRADE'}
              </button>
            </div>
          </div>
        {:else}
          <div class="modal-inner">
            <h3>You need more Bits for this upgrade.</h3>
            <div class="modal-actions">
              <button type="button" class="button secondary-button" on:click={closeModal}>KEEP BUILDING</button>
            </div>
          </div>
        {/if}
      </RoughFrame>
    </div>
  </div>
{/if}

<style>
  .shop-page {
    padding-bottom: clamp(60px, 8vw, 100px);
  }

  .shop-top {
    padding: clamp(48px, 7vw, 80px) clamp(18px, 4vw, 54px) clamp(24px, 4vw, 40px);
  }

  .shop-top-shell {
    display: grid;
    justify-items: start;
    gap: 14px;
  }

  .shop-page h1 {
    max-width: 640px;
    font-size: clamp(2.2rem, 4.4vw, 3.4rem);
    line-height: 1.05;
    font-weight: 800;
  }

  .shop-subhead {
    max-width: 560px;
    color: var(--muted);
    font-size: 1.05rem;
    line-height: 1.55;
    font-weight: 500;
  }

  .shop-rate {
    margin-top: 4px;
    font-family: 'Kalam', cursive;
    font-weight: 700;
    font-size: clamp(1.1rem, 2vw, 1.4rem);
    color: var(--ink);
  }

  .shop-tracking {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--muted);
  }

  .balance-readout {
    margin-top: 8px;
    width: min(100%, 300px);
  }

  .balance-readout :global(.rough-frame-content) {
    display: grid;
    justify-items: start;
    gap: 4px;
    padding: 18px 22px;
  }

  .balance-label {
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    color: var(--muted);
  }

  .balance-amount {
    font-size: 2.1rem;
    font-weight: 800;
    line-height: 1;
    color: var(--red);
  }

  .balance-line {
    font-size: 0.92rem;
    font-weight: 600;
    color: var(--muted);
  }

  .level-indicator {
    margin-top: 4px;
    display: flex;
    align-items: baseline;
    gap: 8px;
  }

  .level-indicator-label {
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    color: var(--muted);
  }

  .level-indicator-value {
    font-family: 'Kalam', cursive;
    font-weight: 700;
    font-size: 0.95rem;
    color: var(--ink);
  }

  .category-nav {
    margin-top: 10px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .category-pill {
    border: 2px solid var(--ink);
    border-radius: 999px;
    background: transparent;
    color: var(--ink);
    font-weight: 800;
    font-size: 0.85rem;
    padding: 8px 18px;
    cursor: var(--crosshair);
  }

  .category-pill.active {
    background: var(--ink);
    color: var(--paper);
  }

  .shop-tree-section {
    padding: clamp(20px, 4vw, 40px) clamp(18px, 4vw, 54px);
  }

  .shop-tree {
    display: grid;
    justify-items: center;
    gap: 8px;
  }

  .buddy-node {
    width: 132px;
  }

  .buddy-node :global(.rough-frame-content) {
    display: grid;
    place-items: center;
    aspect-ratio: 1;
  }

  .buddy-node-label {
    font-weight: 800;
    font-size: 1rem;
    letter-spacing: 0.02em;
  }

  .branch-row {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: flex-start;
    gap: clamp(24px, 3vw, 48px);
    margin-top: 4px;
  }

  .branch {
    width: min(100%, 300px);
    display: grid;
    justify-items: center;
    gap: 4px;
  }

  .branch-connector {
    width: 20px;
    height: 44px;
  }

  .branch-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }

  .branch-icon {
    width: 30px;
    height: 30px;
    color: var(--accent);
  }

  .branch-icon svg {
    width: 100%;
    height: 100%;
  }

  .branch-header h2 {
    font-size: 1.2rem;
    font-weight: 800;
  }

  .branch-items {
    display: grid;
    gap: 18px;
    width: 100%;
  }

  .upgrade-inner {
    display: grid;
    gap: 8px;
    padding: 20px;
  }

  .upgrade-inner h3 {
    font-size: 1.1rem;
    line-height: 1.2;
    font-weight: 800;
  }

  .upgrade-item {
    font-weight: 700;
    color: var(--ink);
  }

  .upgrade-price {
    justify-self: start;
    font-weight: 800;
    font-size: 0.85rem;
    color: var(--accent);
    border: 2px solid var(--accent);
    border-radius: 999px;
    padding: 4px 12px;
  }

  .upgrade-reason {
    color: var(--muted);
    font-size: 0.94rem;
    line-height: 1.45;
    font-weight: 500;
  }

  .claim-button {
    justify-self: start;
    min-height: 44px;
    padding: 10px 20px;
    background: var(--accent);
    --shadow: rgba(0, 0, 0, 0.2);
    box-shadow: 0 6px 0 var(--shadow);
    font-size: 0.88rem;
  }

  .upgrade-build {
    margin-top: 6px;
    padding-top: 12px;
    border-top: 2px dashed rgba(38, 50, 77, 0.18);
    display: grid;
    gap: 4px;
  }

  .upgrade-build-label {
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.03em;
    color: var(--muted);
  }

  .upgrade-build p {
    font-size: 0.88rem;
    line-height: 1.4;
    color: var(--ink);
    font-weight: 500;
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(20, 21, 26, 0.4);
    display: grid;
    place-items: center;
    padding: 20px;
    z-index: 50;
  }

  .modal-panel {
    width: min(100%, 380px);
  }

  .modal-inner {
    display: grid;
    gap: 10px;
    padding: 26px;
    text-align: left;
  }

  .modal-inner h3 {
    font-size: 1.25rem;
    font-weight: 800;
    line-height: 1.25;
  }

  .modal-inner p {
    color: var(--muted);
    font-size: 0.98rem;
    font-weight: 500;
  }

  .modal-actions {
    margin-top: 10px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .modal-actions .button {
    min-height: 46px;
    padding: 10px 20px;
    font-size: 0.88rem;
  }

  @media (max-width: 860px) {
    .branch-row {
      flex-direction: column;
      align-items: center;
    }

    .branch {
      width: 100%;
      max-width: 420px;
    }
  }
</style>
