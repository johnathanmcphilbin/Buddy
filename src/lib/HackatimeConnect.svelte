<script>
  import { onMount } from 'svelte';
  import RoughFrame from './RoughFrame.svelte';

  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  let status = { connected: false, project: null, hours: 0, trustLevel: null, banned: false, projects: [], email: null };
  let isLoading = true;
  let isSelecting = false;
  let isSavingEmail = false;
  let emailInput = '';
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
      errorMessage = `Could not connect Hackatime: ${oauthError}`;
      params.delete('hackatime_error');
      const cleanUrl = window.location.pathname + (params.toString() ? `?${params}` : '') + window.location.hash;
      window.history.replaceState({}, '', cleanUrl);
    }

    loadStatus();
  });

  function connect() {
    window.location.href = '/api/auth/hackatime/login';
  }

  async function saveEmail() {
    if (!EMAIL_PATTERN.test(emailInput.trim())) {
      errorMessage = 'Enter a valid email address.';
      return;
    }

    isSavingEmail = true;
    errorMessage = '';

    try {
      const response = await fetch('/api/hackatime/set-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput.trim() })
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Could not save that email.');
      }

      await loadStatus();
    } catch (error) {
      errorMessage = error.message;
    } finally {
      isSavingEmail = false;
    }
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

<div class="hackatime-widget" id="hackatime">
  <div class="hackatime-widget-heading">
    <p class="hackatime-widget-label">CONNECT HACKATIME</p>
    <a class="lapse-link" href="https://lapse.hackclub.com/" target="_blank" rel="noopener">TRACK WITH LAPSE →</a>
  </div>

  <div class="hackatime-panel">
    <RoughFrame stroke="#338eda" fill="#fffdf6" seed={41} radius={18} roughness={2}>
      <div class="hackatime-inner">
        {#if isLoading}
          <span class="hackatime-status">Checking connection…</span>
        {:else if status.banned}
          <span class="hackatime-status">Not connected</span>
          <p class="hackatime-banned">This Hackatime account has been flagged by Hackatime's trust system and can't be connected here.</p>
        {:else if !status.connected}
          <span class="hackatime-status">Not connected</span>
          <button type="button" class="button secondary-button" on:click={connect}>CONNECT HACKATIME</button>
        {:else if !status.email}
          <span class="hackatime-status">Connected</span>
          <p class="hackatime-picker-label">YOUR EMAIL</p>
          <p class="hackatime-email-hint">We use this (not your Hackatime username) to find your account when you submit or spend Bits.</p>
          <div class="hackatime-connect-row">
            <input
              class="hackatime-input"
              type="email"
              placeholder="you@example.com"
              bind:value={emailInput}
              on:keydown={(event) => event.key === 'Enter' && saveEmail()}
              disabled={isSavingEmail}
            />
            <button type="button" class="button secondary-button" on:click={saveEmail} disabled={isSavingEmail}>
              {isSavingEmail ? 'Saving…' : 'Save email'}
            </button>
          </div>
          <button type="button" class="hackatime-reset" on:click={disconnect}>Disconnect</button>
        {:else if !status.project}
          <span class="hackatime-status">Connected as {status.email}</span>
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
          <span class="hackatime-status">Connected as {status.email}</span>
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

<style>
  .hackatime-widget {
    width: min(100%, 480px);
    margin: 0 auto 28px;
  }

  .hackatime-widget-heading {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 8px;
  }

  .hackatime-widget-label {
    font-weight: 800;
    font-size: 0.72rem;
    letter-spacing: 0.04em;
    color: var(--muted);
  }

  .lapse-link {
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.03em;
    color: var(--blue);
    text-decoration: underline;
  }

  .hackatime-panel {
    width: 100%;
  }

  .hackatime-inner {
    display: grid;
    justify-items: start;
    gap: 8px;
    padding: 16px 18px;
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

  .hackatime-email-hint {
    font-size: 0.82rem;
    color: var(--muted);
    font-weight: 500;
    max-width: 380px;
  }

  .hackatime-connect-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    width: 100%;
  }

  .hackatime-input {
    flex: 1 1 200px;
    min-height: 46px;
    padding: 10px 14px;
    border: 2px solid var(--ink);
    border-radius: 12px;
    font-family: inherit;
    font-size: 0.95rem;
    background: var(--white);
    color: var(--ink);
  }

  .hackatime-project-list {
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start;
    gap: 6px;
    max-height: 190px;
    overflow-y: auto;
    padding: 2px;
    width: 100%;
  }

  .hackatime-project {
    border: 2px solid var(--ink);
    border-radius: 999px;
    background: var(--white);
    padding: 5px 12px;
    font-weight: 700;
    font-size: 0.8rem;
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
    font-size: clamp(1.5rem, 3vw, 1.9rem);
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
