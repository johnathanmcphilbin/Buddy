<script>
  import Mascot from './Mascot.svelte';
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
</script>

<section class="section buddy-level-section" id="buddy-level">
  <div class="section-shell">
    <div class="level-heading">
      <p class="eyebrow">BUDDY LEVEL</p>
      <h2>How upgraded is your Buddy?</h2>
      <p class="section-lede">Every Buddy starts at Level 1 once it can see, understand, and talk. Every upgrade you add after that pushes it up another level.</p>
    </div>

    <div class="level-base-card">
      <span class="level-base-tag">LEVEL 1</span>
      <span class="level-base-title">BASE BUDDY</span>
      <p class="level-base-desc">Sees. Understands. Talks.</p>
    </div>

    <div class="level-diagram">
      <svg class="level-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d="M12 12 C 22 20, 34 30, 45 42" fill="none" stroke="#ec3750" stroke-width="0.5" stroke-linecap="round" />
        <path d="M36 5 C 38 16, 42 26, 47 40" fill="none" stroke="#a633d6" stroke-width="0.5" stroke-linecap="round" />
        <path d="M64 5 C 62 16, 58 26, 53 40" fill="none" stroke="#ff8c37" stroke-width="0.5" stroke-linecap="round" />
        <path d="M88 12 C 78 20, 66 30, 55 42" fill="none" stroke="#f1c40f" stroke-width="0.5" stroke-linecap="round" />
        <path d="M4 50 C 18 50, 30 50, 42 50" fill="none" stroke="#338eda" stroke-width="0.5" stroke-linecap="round" />
        <path d="M96 50 C 82 50, 70 50, 58 50" fill="none" stroke="#a633d6" stroke-width="0.5" stroke-linecap="round" />
        <path d="M12 88 C 22 80, 34 70, 45 58" fill="none" stroke="#33d6a6" stroke-width="0.5" stroke-linecap="round" />
        <path d="M36 95 C 38 84, 42 74, 47 60" fill="none" stroke="#ec3750" stroke-width="0.5" stroke-linecap="round" />
        <path d="M64 95 C 62 84, 58 74, 53 60" fill="none" stroke="#338eda" stroke-width="0.5" stroke-linecap="round" />
        <path d="M88 88 C 78 80, 66 70, 55 58" fill="none" stroke="#33d6a6" stroke-width="0.5" stroke-linecap="round" />
      </svg>

      <div class="level-buddy">
        <Mascot state="idle" size={116} />
      </div>

      {#each upgrades as upgrade, index (upgrade.id)}
        <div
          class={`level-tag level-tag-${index + 1}`}
          class:active={$purchasedUpgrades.includes(upgrade.id)}
          style={`--accent:${upgrade.accent}`}
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
