<script>
  import { onMount } from 'svelte';
  import RoughFrame from './RoughFrame.svelte';

  let status = { connected: false, project: null, hours: 0, trustLevel: null, banned: false, projects: [] };
  let isLoading = true;
  let isSelecting = false;
  let errorMessage = '';

  async function loadStatus() {
    try {
      const response = await fetch('/api/hackatime/status');
      status = await response.json();
    } catch {
      errorMessage = 'Could not reach Hackatime right now.';
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get('hackatime_error');
    if (oauthError) {
      errorMessage = 'Could not connect Hackatime. Try again.';
      params.delete('hackatime_error');
      const cleanUrl = window.location.pathname + (params.toString() ? `?${params}` : '') + window.location.hash;
      window.history.replaceState({}, '', cleanUrl);
    }

    loadStatus();
  });

  function connect() {
    window.location.href = '/api/auth/hackatime/login';
  }

  async function chooseProject(projectName) {
    isSelecting = true;
    errorMessage = '';

    try {
      const response = await fetch('/api/hackatime/select-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: projectName })
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Could not select that project.');
      }

      await loadStatus();
    } catch (error) {
      errorMessage = error.message;
    } finally {
      isSelecting = false;
    }
  }

  async function disconnect() {
    await fetch('/api/auth/hackatime/logout', { method: 'POST' });
    await loadStatus();
  }
</script>

<section class="section hackatime-section" id="hackatime">
  <div class="section-shell">
    <div class="hackatime-heading">
      <p class="eyebrow">CONNECT HACKATIME</p>
      <h2>How many hours have you put in?</h2>
      <p class="section-lede">Connect Hackatime and pick which project is your Buddy to see your real tracked hours.</p>
    </div>

    <div class="hackatime-panel">
      <RoughFrame stroke="#338eda" fill="#fffdf6" seed={41} radius={24} roughness={2}>
        <div class="hackatime-inner">
          {#if isLoading}
            <span class="hackatime-status">Checking connection…</span>
          {:else if status.banned}
            <span class="hackatime-status">Not connected</span>
            <p class="hackatime-banned">This Hackatime account has been flagged by Hackatime's trust system and can't be connected here.</p>
          {:else if !status.connected}
            <span class="hackatime-status">Not connected</span>
            <button type="button" class="button secondary-button" on:click={connect}>CONNECT HACKATIME</button>
          {:else if !status.project}
            <span class="hackatime-status">Connected</span>
            <p class="hackatime-picker-label">YOUR BUDDY PROJECT</p>
            <div class="hackatime-project-list">
              {#each status.projects as project}
                <button type="button" class="hackatime-project" on:click={() => chooseProject(project.name)} disabled={isSelecting}>
                  {project.name}
                </button>
              {/each}
            </div>
            <button type="button" class="hackatime-reset" on:click={disconnect}>Disconnect</button>
          {:else}
            <span class="hackatime-status">Connected</span>
            <p class="hackatime-picker-label">YOUR BUDDY PROJECT</p>
            <p class="hackatime-project-name">{status.project}</p>
            <p class="hackatime-hours-label">HOURS BUILT</p>
            <p class="hackatime-hours-value">{status.hours.toFixed(1)}</p>
            <button type="button" class="hackatime-reset" on:click={disconnect}>Disconnect</button>
          {/if}

          {#if errorMessage}
            <p class="hackatime-error">{errorMessage}</p>
          {/if}
        </div>
      </RoughFrame>
    </div>
  </div>
</section>

<style>
  .hackatime-section {
    padding-top: clamp(40px, 5vw, 64px);
    padding-bottom: clamp(40px, 5vw, 64px);
  }

  .hackatime-heading {
    display: grid;
    justify-items: center;
    gap: 10px;
    text-align: center;
    max-width: 560px;
    margin: 0 auto;
  }

  .hackatime-panel {
    width: min(100%, 480px);
    margin: 28px auto 0;
  }

  .hackatime-inner {
    display: grid;
    justify-items: start;
    gap: 10px;
    padding: 24px;
  }

  .hackatime-status {
    font-weight: 800;
    font-size: 0.85rem;
    letter-spacing: 0.03em;
    color: var(--muted);
  }

  .hackatime-picker-label,
  .hackatime-hours-label {
    font-weight: 800;
    font-size: 0.72rem;
    letter-spacing: 0.04em;
    color: var(--muted);
    margin-top: 4px;
  }

  .hackatime-project-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .hackatime-project {
    border: 2px solid var(--ink);
    border-radius: 999px;
    background: var(--white);
    padding: 7px 14px;
    font-weight: 700;
    font-size: 0.85rem;
    cursor: var(--crosshair);
  }

  .hackatime-project:hover {
    background: var(--ink);
    color: var(--paper);
  }

  .hackatime-project-name {
    font-family: 'Kalam', cursive;
    font-weight: 700;
    font-size: 1.1rem;
  }

  .hackatime-hours-value {
    font-size: clamp(2rem, 4vw, 2.6rem);
    font-weight: 800;
    color: var(--blue);
    line-height: 1;
  }

  .hackatime-reset {
    background: none;
    border: none;
    padding: 0;
    color: var(--muted);
    font-size: 0.85rem;
    font-weight: 600;
    text-decoration: underline;
    text-decoration-thickness: 2px;
    text-underline-offset: 3px;
    cursor: var(--crosshair);
  }

  .hackatime-error {
    color: var(--red);
    font-size: 0.88rem;
    font-weight: 600;
  }

  .hackatime-banned {
    color: var(--red);
    font-size: 0.9rem;
    font-weight: 600;
  }
</style>
