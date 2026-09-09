<script>
  import { onMount, tick } from 'svelte';
  import Mascot from './Mascot.svelte';
  import HackatimeConnect from './HackatimeConnect.svelte';
  import RoughFrame from './RoughFrame.svelte';
  import { purchasedUpgrades, buddyLevel } from './buddyStore.js';

  const upgrades = [
    { id: 'better-eyes', label: 'BETTER EYES', icon: 'eyes', accent: '#ec3750' },
    { id: 'better-vision', label: 'BETTER VISION', icon: 'vision', accent: '#a633d6' },
    { id: 'brain', label: 'BRAIN', icon: 'brain', accent: '#ff8c37' },
    { id: 'memory', label: 'MEMORY', icon: 'memory', accent: '#f1c40f' },
    { id: 'ears', label: 'EARS', icon: 'ears', accent: '#338eda' },
    { id: 'custom-voice', label: 'CUSTOM VOICE', icon: 'voice', accent: '#a633d6' },
    { id: 'body', label: 'BODY', icon: 'body', accent: '#33d6a6' },
    { id: 'face', label: 'FACE', icon: 'face', accent: '#ec3750' },
    { id: 'more-senses', label: 'MORE SENSES', icon: 'senses', accent: '#338eda' },
    { id: 'training-power', label: 'TRAINING POWER', icon: 'training', accent: '#33d6a6' }
  ];

  let diagramEl;
  let buddyEl;
  let tagEls = [];
  let viewW = 0;
  let viewH = 0;
  let linePaths = upgrades.map(() => '');

  function updateLines() {
    if (!diagramEl || !buddyEl) return;
    const rect = diagramEl.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    viewW = rect.width;
    viewH = rect.height;

    const buddyRect = buddyEl.getBoundingClientRect();
    const bx = buddyRect.left + buddyRect.width / 2 - rect.left;
    const by = buddyRect.top + buddyRect.height / 2 - rect.top;

    linePaths = tagEls.map((el) => {
      if (!el) return '';
      const tagRect = el.getBoundingClientRect();
      const tx = tagRect.left + tagRect.width / 2 - rect.left;
      const ty = tagRect.top + tagRect.height / 2 - rect.top;
      const mx = (bx + tx) / 2;
      const my = (by + ty) / 2;
      return `M${bx} ${by} Q ${mx} ${my} ${tx} ${ty}`;
    });
  }

  onMount(() => {
    let frame;
    const scheduleUpdate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateLines);
    };

    tick().then(updateLines);

    const resizeObserver = new ResizeObserver(scheduleUpdate);
    resizeObserver.observe(diagramEl);
    window.addEventListener('resize', scheduleUpdate);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener('resize', scheduleUpdate);
    };
  });
</script>

<section class="section buddy-level-section" id="buddy-level">
  <div class="section-shell">
    <div class="level-top-layout">
      <div class="level-intro-col">
        <div class="level-heading">
          <p class="eyebrow">BUDDY LEVEL</p>
          <h2>How upgraded is your Buddy?</h2>
          <p class="section-lede">Every Buddy starts at Level 1 once it can see, understand, and talk. Every upgrade you add after that pushes it up another level.</p>
          <p class="section-lede level-lede-note">Upgrades cost Bits, and Bits come from hours you submit and get approved. <a href="/submit.html">Submit your build</a> to earn Bits, then spend them in the <a href="/shop.html">shop</a>.</p>
        </div>

        <HackatimeConnect />
      </div>

      <div class="level-diagram-col">
        <div class="level-base-card">
          <RoughFrame stroke="#26324d" fill="#fffdf6" seed={19} radius={16} roughness={1.9}>
            <div class="level-base-card-inner">
              <span class="level-base-tag">LEVEL 1</span>
              <span class="level-base-title">BASE BUDDY</span>
              <p class="level-base-desc">Sees. Understands. Talks.</p>
              <a class="level-tutorial-link" href="/docs/buddy-level-1-tutorial.pdf" download>Download the Level 1 build guide (PDF) →</a>
            </div>
          </RoughFrame>
        </div>

        <div class="level-diagram" bind:this={diagramEl}>
        <svg class="level-lines" viewBox={`0 0 ${viewW} ${viewH}`} aria-hidden="true">
          {#each upgrades as upgrade, index (upgrade.id)}
            <path d={linePaths[index]} fill="none" stroke={upgrade.accent} stroke-width="1.5" stroke-linecap="round" />
          {/each}
        </svg>

        <div class="level-buddy" bind:this={buddyEl}>
          <Mascot state="idle" size={116} />
        </div>

        {#each upgrades as upgrade, index (upgrade.id)}
        <div
          class={`level-tag level-tag-${index + 1}`}
          class:active={$purchasedUpgrades.includes(upgrade.id)}
          style={`--accent:${upgrade.accent}`}
          bind:this={tagEls[index]}
        >
          <span class="level-tag-icon">
            {#if upgrade.icon === 'eyes'}
              <svg viewBox="0 0 32 32" aria-hidden="true">
                <path d="M3 16c4-7 22-7 26 0-4 7-22 7-26 0Z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" />
                <circle cx="16" cy="16" r="4.5" fill="none" stroke="currentColor" stroke-width="2.2" />
              </svg>
            {:else if upgrade.icon === 'brain'}
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
            {:else if upgrade.icon === 'vision'}
              <svg viewBox="0 0 32 32" aria-hidden="true">
                <path d="M3 16c4-7 22-7 26 0-4 7-22 7-26 0Z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" />
                <path d="M12 16a4 4 0 0 1 8 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                <path d="M22 9l3-3M25 16h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
            {:else if upgrade.icon === 'memory'}
              <svg viewBox="0 0 32 32" aria-hidden="true">
                <rect x="6" y="6" width="20" height="20" rx="3" fill="none" stroke="currentColor" stroke-width="2.2" />
                <path d="M11 6v6h10V6M11 26v-6h10v6" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
              </svg>
            {:else if upgrade.icon === 'face'}
              <svg viewBox="0 0 32 32" aria-hidden="true">
                <rect x="5" y="6" width="22" height="20" rx="4" fill="none" stroke="currentColor" stroke-width="2.2" />
                <circle cx="13" cy="15" r="1.6" fill="currentColor" />
                <circle cx="19" cy="15" r="1.6" fill="currentColor" />
                <path d="M12 20c1.4 1.4 6.6 1.4 8 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
            {:else if upgrade.icon === 'senses'}
              <svg viewBox="0 0 32 32" aria-hidden="true">
                <circle cx="16" cy="16" r="2.4" fill="currentColor" />
                <path d="M10 16a6 6 0 0 1 12 0M6 16a10 10 0 0 1 20 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
            {:else if upgrade.icon === 'ears'}
              <svg viewBox="0 0 32 32" aria-hidden="true">
                <rect x="12" y="4" width="8" height="16" rx="4" fill="none" stroke="currentColor" stroke-width="2.2" />
                <path d="M8 16c0 4.4 3.6 8 8 8s8-3.6 8-8M16 24v4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
              </svg>
            {:else if upgrade.icon === 'voice'}
              <svg viewBox="0 0 32 32" aria-hidden="true">
                <path d="M6 20V12l8-6v20l-8-6Z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" />
                <path d="M20 11c2.2 1.4 2.2 8.6 0 10M24 7c4 3 4 15 0 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
            {:else if upgrade.icon === 'body'}
              <svg viewBox="0 0 32 32" aria-hidden="true">
                <path d="M16 4v6M9 12h14l-2 16H11L9 12Z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" />
                <path d="M13 18h6M13 23h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
            {:else}
              <svg viewBox="0 0 32 32" aria-hidden="true">
                <path d="M5 24 12 15 18 20 27 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M20 7h7v7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            {/if}
          </span>
          <span class="level-tag-label">{upgrade.label}</span>
        </div>
      {/each}
        </div>
      </div>
    </div>

    <div class="level-status">
      <span class="level-status-label">YOUR BUDDY</span>
      <span class="level-status-value">LEVEL {$buddyLevel}</span>

      <div class="level-badges">
        <span class="level-badge active">BASE</span>
        <span class="level-badge active">SEES</span>
        <span class="level-badge active">UNDERSTANDS</span>
        <span class="level-badge active">TALKS</span>
        {#each upgrades as upgrade (upgrade.id)}
          <span class="level-badge" class:active={$purchasedUpgrades.includes(upgrade.id)}>{upgrade.label}</span>
        {/each}
      </div>

      <a class="button secondary-button level-cta" href="/shop.html">UPGRADE YOUR BUDDY →</a>
    </div>
  </div>
</section>
