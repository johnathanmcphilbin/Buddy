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
          item: "Webcam reward",
          fulfillment: "Shipped hardware",
          maxValue: "Up to $30 product + $10 shipping",
          examples: ["USB WEBCAM", "WEBCAM MOUNT"],
          price: 8,
          reason: 'Point Buddy somewhere your laptop can’t.',
          build: 'Point Buddy at your desk, doorway, shelf, or anywhere your laptop can’t.',
          group: 'better-eyes'
        },
        {
          id: 'better-lighting',
          title: 'Better Lighting',
          item: "Lighting reward",
          fulfillment: "Shipped hardware",
          maxValue: "Up to $20 product + $10 shipping",
          examples: ["USB RING LIGHT", "CLIP-ON LIGHT", "MINI LED PANEL"],
          price: 6,
          reason: 'Give Buddy cleaner training photos and more reliable detections.',
          build: 'Make your detector work better in messy rooms or darker spaces.',
          group: null
        },
        {
          id: 'better-vision',
          title: 'Give Buddy Better Vision',
          item: "Roboflow credit grant",
          fulfillment: "Digital credits",
          maxValue: "Up to $10 in digital credits",
          examples: ["ROBOFLOW TRAINING CREDITS", "MORE INFERENCE", "MORE DATASET VERSIONS"],
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
          item: "AI API credit grant",
          fulfillment: "Digital credits",
          maxValue: "Up to $10 in digital credits",
          examples: ["OPENAI API CREDITS", "OTHER AI API CREDITS"],
          price: 2,
          reason: 'Replace fixed responses with generated ones.',
          build: 'Let Buddy come up with its own responses instead of using fixed sentences.',
          group: 'brain'
        },
        {
          id: 'brain-25',
          title: 'Give Buddy a Bigger Brain',
          item: "AI API credit grant",
          fulfillment: "Digital credits",
          maxValue: "Up to $25 in digital credits",
          examples: ["MORE AI CREDITS", "VISION + TEXT MODELS", "LONGER RUNNING ASSISTANT FEATURES"],
          price: 5,
          reason: 'Take Buddy further with generated responses and smarter behavior.',
          build: 'Add more personality, better responses, or more advanced assistant behavior.',
          group: 'brain'
        },
        {
          id: 'memory',
          title: 'Give Buddy a Memory',
          item: "Database / storage credit grant",
          fulfillment: "Digital credits",
          maxValue: "Up to $15 in digital credits",
          examples: ["SUPABASE", "NEON", "FIREBASE", "UPSTASH"],
          price: 3,
          reason: 'Let Buddy remember what happened earlier instead of only reacting to the current frame.',
          build: 'Make Buddy remember routines, past detections, or what you usually forget.',
          group: 'memory'
        },
        {
          id: 'training-power',
          title: 'Train Buddy Properly',
          item: "Roboflow grant",
          fulfillment: "Digital credits",
          maxValue: "Up to $100 toward Roboflow Core or credits",
          examples: ["ROBOFLOW CORE", "MORE TRAINING", "MORE INFERENCE"],
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
          item: "Microphone reward",
          fulfillment: "Shipped hardware",
          maxValue: "Up to $25 product + $10 shipping",
          examples: ["USB MICROPHONE", "LAV MICROPHONE"],
          price: 7,
          reason: 'Let Buddy react to what it hears as well as what it sees.',
          build: 'Build a Buddy that listens for commands while also watching what is happening.',
          group: 'ears'
        },
        {
          id: 'custom-voice',
          title: 'Give Buddy a Voice',
          item: "ElevenLabs grant",
          fulfillment: "Digital credits",
          maxValue: "Up to $15 toward ElevenLabs credits or a subscription",
          examples: ["ELEVENLABS CREDITS", "CUSTOM VOICE GENERATION"],
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
          item: "Hardware grant",
          fulfillment: "Source your own parts",
          maxValue: "Up to $25 to buy your own parts",
          examples: ["ESP32", "SERVO", "LEDS", "BUTTONS", "BREADBOARD"],
          price: 5,
          reason: 'Buy LEDs, servos, buttons, displays, or whatever lets Buddy affect the real world.',
          build: 'Make Buddy light something up, move something, or control something physical.',
          group: 'body'
        },
        {
          id: 'face',
          title: 'Give Buddy a Face',
          item: "Display reward",
          fulfillment: "Shipped hardware",
          maxValue: "Up to $30 product + $10 shipping",
          examples: ["OLED DISPLAY", "TFT SCREEN", "LED MATRIX", "ESP32 DISPLAY"],
          price: 8,
          reason: 'Put Buddy’s status, expressions, or responses on a physical screen.',
          build: 'Give Buddy a little face that changes depending on what it sees.',
          group: 'face'
        },
        {
          id: 'more-senses',
          title: 'Give Buddy More Senses',
          item: "Sensor hardware grant",
          fulfillment: "Source your own parts",
          maxValue: "Up to $50 to buy your own parts",
          examples: ["BME280", "VL53L0X", "PIR SENSOR", "LIGHT SENSOR", "ESP32", "BREADBOARD"],
          price: 10,
          reason: 'Get an ESP32 board, a breadboard, jumper wires, and sensors such as a BME280 for temperature or a VL53L0X for distance.',
          build: 'Have Buddy tell you when your room gets too warm, or greet you when you move closer to your desk. Read the sensor data and write the rules that decide what Buddy says.',
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
      if (!response.ok) throw new Error('Balance unavailable');
      hackatimeConnected = data.status !== 'Not connected';
      if (typeof data.balance === 'number') {
        bits.set(data.balance);
      }
      if (typeof data.trackedHours === 'number') {
        hoursBuilt = data.trackedHours;
      }
    } catch {
      bits.set(0);
      hackatimeConnected = false;
    }
  }

  onMount(loadBalance);

  $: visibleItems = branches
    .filter((branch) => activeCategory === 'ALL' || branch.key === activeCategory)
    .flatMap((branch) => branch.items.map((item) => ({ ...item, category: branch.key, accent: branch.accent })));

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
    if (!selectedItem || isClaiming) return;

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
      <p class="eyebrow">BUDDY GRANT SHOP</p>
      <div class="heading-row">
        <h1>Upgrade your Buddy.</h1>
        <img class="heading-sticker" src="/images/buddy-star.png" alt="" aria-hidden="true" />
      </div>
      <p class="shop-subhead">Every hour you build earns you 1 Bit. Spend your Bits on grants, digital credits, and shipped hardware to help Buddy see, think, hear, and do more.</p>

      <p class="shop-rate">1 HOUR = 1 BIT · 1 BIT = $5</p>
      <div class="shop-grant-note">
        <p><strong>Know what you’re claiming.</strong> Every upgrade shows its maximum value and how you receive it. “You could get” lists examples, not a fixed model or a bundle of everything shown.</p>
        <p>For hardware we ship, $10 (2 Bits) of the total covers shipping. Body and More Senses are grants to buy your own parts, so the full $25 or $50 goes toward your purchase.</p>
      </div>
      <p class="shop-tracking">Tracked with <a href="https://lapse.hackclub.com/" target="_blank" rel="noopener">Lapse</a> and Hackatime.</p>

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

      <a class="submit-callout" href="/submit.html">
        <RoughFrame stroke="#ec3750" fill="#fff5f2" seed={31} radius={18} roughness={1.9}>
          <span class="submit-callout-inner">Go to <strong>Submit</strong> to get your Bits! →</span>
        </RoughFrame>
      </a>
    </div>
  </section>

  <section class="shop-catalog-section">
    <div class="section-shell">
      <div class="shop-catalog">
        {#each visibleItems as upgrade (upgrade.id)}
          <article class="upgrade-card">
            <RoughFrame stroke={upgrade.accent} fill="#ffffff" seed={upgrade.price + 20} radius={20} roughness={2}>
              <div class="upgrade-inner">
                <span class="upgrade-category" style={`--accent:${upgrade.accent}`}>{upgrade.category}</span>
                <h3>{upgrade.title}</h3>
                <p class="upgrade-item">{upgrade.item}</p>
                <span class="upgrade-fulfillment">{upgrade.fulfillment}</span>
                <span class="upgrade-price" style={`--accent:${upgrade.accent}`}>{upgrade.price} BITS</span>
                <p class="upgrade-value">{upgrade.maxValue}</p>
                <p class="upgrade-reason">{upgrade.reason}</p>
                <div class="upgrade-examples" style={`--accent:${upgrade.accent}`}>
                  <span class="upgrade-examples-label" id={`examples-${upgrade.id}`}>YOU COULD GET</span>
                  <ul aria-labelledby={`examples-${upgrade.id}`}>
                    {#each upgrade.examples as example}
                      <li>{example}</li>
                    {/each}
                  </ul>
                </div>

                <button type="button" class="button claim-button" style={`--accent:${upgrade.accent}`} on:click={() => openClaim(upgrade)}>
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
  </section>
</main>

<footer class="site-footer">
  <div class="section-shell footer-layout">
    <a href="https://hackclub.com">Hack Club</a>
    <a href="https://hackclub.com/privacy-and-terms">Privacy &amp; Terms</a>
    <a href="https://github.com/johnathanmcphilbin/Buddy" target="_blank" rel="noopener">GitHub</a>
    <a href="https://callum-moody.carrd.co/" target="_blank" rel="noopener">Art by Callum Moody</a>
  </div>
</footer>

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
            <p><strong>{selectedItem.item}</strong> · {selectedItem.fulfillment}</p>
            <p>{selectedItem.maxValue}</p>
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

  .shop-tracking a {
    color: var(--red);
    font-weight: 800;
    text-decoration: underline;
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

  .submit-callout {
    display: block;
    margin-top: 6px;
    width: fit-content;
    text-decoration: none;
    cursor: var(--crosshair);
  }

  .submit-callout :global(.rough-frame-content) {
    padding: 12px 20px;
  }

  .submit-callout-inner {
    font-weight: 700;
    font-size: 0.98rem;
    color: var(--ink);
  }

  .submit-callout-inner strong {
    color: var(--red);
  }

  .shop-catalog-section {
    padding: clamp(20px, 4vw, 40px) clamp(18px, 4vw, 54px);
  }

  .shop-catalog {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 20px;
    align-items: start;
  }

  .upgrade-category {
    justify-self: start;
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    color: var(--accent);
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

  .shop-grant-note {
    display: grid;
    gap: 8px;
    max-width: 720px;
    padding: 14px 18px;
    border-left: 3px solid var(--orange);
    background: var(--paper-soft);
    font-size: 0.95rem;
    line-height: 1.55;
    color: var(--ink);
  }

  .upgrade-fulfillment {
    font-size: 0.875rem;
    color: var(--muted);
  }

  .upgrade-value {
    font-size: 1rem;
    line-height: 1.45;
    font-weight: 700;
    color: var(--ink);
  }

  .upgrade-examples {
    display: grid;
    gap: 8px;
    margin: 6px 0;
    padding-top: 12px;
    border-top: 2px dashed rgba(38, 50, 77, 0.18);
    min-width: 0;
  }

  .upgrade-examples-label {
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    color: var(--muted);
  }

  .upgrade-examples ul {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .upgrade-examples li {
    max-width: 100%;
    padding: 5px 8px;
    border: 1px solid var(--accent);
    border-radius: 6px;
    background: var(--paper);
    color: var(--ink);
    font-size: 0.8rem;
    font-weight: 600;
    line-height: 1.4;
    overflow-wrap: anywhere;
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

</style>
