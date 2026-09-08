<script>
  import { onMount } from 'svelte';
  import RoughFrame from './lib/RoughFrame.svelte';

  let status = { connected: false, project: null, hours: 0 };
  let isLoading = true;
  let isSubmitting = false;
  let submitted = false;
  let errorMessage = '';

  let firstName = '';
  let lastName = '';
  let email = '';
  let githubUsername = '';
  let githubUrl = '';
  let demoVideoUrl = '';
  let roboflowUrl = '';
  let description = '';

  onMount(async () => {
    try {
      const response = await fetch('/api/hackatime/status');
      status = await response.json();
    } catch {
      // Hackatime status just won't show — the form below still requires it before submitting.
    } finally {
      isLoading = false;
    }
  });

  async function handleSubmit(event) {
    event.preventDefault();
    errorMessage = '';
    isSubmitting = true;

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          githubUsername,
          githubUrl,
          demoVideoUrl,
          roboflowUrl,
          description
        })
      });

      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Could not submit right now.');

      submitted = true;
    } catch (error) {
      errorMessage = error.message;
    } finally {
      isSubmitting = false;
    }
  }
</script>

<header class="site-header">
  <div class="brand-lockup">
    <a class="hackclub-flag-link" href="https://hackclub.com" target="_blank" rel="noopener" aria-label="Hack Club">
      <img class="hackclub-flag" src="/images/hackclub-flag.svg" alt="Hack Club" />
    </a>
    <a href="/" aria-label="Buddy">
      <span>Buddy</span>
    </a>
  </div>
  <nav aria-label="Primary">
    <a href="/">Back to Buddy</a>
    <a href="/shop.html">Shop</a>
  </nav>
</header>

<main class="submit-page">
  <section class="section submit-top">
    <div class="section-shell submit-top-shell">
      <p class="eyebrow">SUBMIT BUDDY</p>
      <h1>Submit your Buddy.</h1>
      <p class="submit-subhead">A working live webcam demo, your Roboflow project or dataset, and a short video showing Buddy detecting multiple objects and speaking different responses based on what it sees.</p>

      {#if !isLoading}
        <div class="submit-hackatime">
          <RoughFrame stroke="#338eda" fill="#fffdf6" seed={31} radius={18} roughness={1.8}>
            <div class="submit-hackatime-inner">
              {#if status.connected && status.project}
                <span class="submit-hackatime-label">YOUR HACKATIME</span>
                <span class="submit-hackatime-project">{status.project}</span>
                <span class="submit-hackatime-hours">{status.hours.toFixed(1)} hours tracked</span>
              {:else}
                <span class="submit-hackatime-label">HACKATIME NOT CONNECTED</span>
                <a class="submit-hackatime-link" href="/#hackatime">Connect Hackatime first →</a>
              {/if}
            </div>
          </RoughFrame>
        </div>
      {/if}
    </div>
  </section>

  <section class="section submit-form-section">
    <div class="section-shell">
      <div class="submit-form-frame">
        <RoughFrame stroke="#33d6a6" fill="#fffdf6" seed={64} radius={26} roughness={2}>
          <div class="submit-form-inner">
            {#if submitted}
              <div class="submit-success">
                <span class="scribble">SUBMITTED</span>
                <p>Your Buddy is in for review. You'll see the status on this page once it's checked.</p>
              </div>
            {:else if !status.connected || !status.project}
              <div class="submit-locked">
                <p>Connect Hackatime and pick your Buddy project before you can submit.</p>
                <a class="button secondary-button" href="/#hackatime">Connect Hackatime</a>
              </div>
            {:else}
              <form class="submit-form" on:submit={handleSubmit}>
                <div class="submit-field-row">
                  <label class="submit-field">
                    <span>First name</span>
                    <input type="text" bind:value={firstName} required disabled={isSubmitting} />
                  </label>
                  <label class="submit-field">
                    <span>Last name</span>
                    <input type="text" bind:value={lastName} required disabled={isSubmitting} />
                  </label>
                </div>

                <label class="submit-field">
                  <span>Email</span>
                  <input type="email" bind:value={email} required disabled={isSubmitting} />
                </label>

                <div class="submit-field-row">
                  <label class="submit-field">
                    <span>GitHub username</span>
                    <input type="text" bind:value={githubUsername} required disabled={isSubmitting} />
                  </label>
                  <label class="submit-field">
                    <span>GitHub URL</span>
                    <input type="url" bind:value={githubUrl} placeholder="https://github.com/you/buddy" required disabled={isSubmitting} />
                  </label>
                </div>

                <label class="submit-field">
                  <span>Demo video URL</span>
                  <input type="url" bind:value={demoVideoUrl} placeholder="https://youtube.com/..." required disabled={isSubmitting} />
                </label>

                <label class="submit-field">
                  <span>Roboflow project URL (optional)</span>
                  <input type="url" bind:value={roboflowUrl} placeholder="https://app.roboflow.com/..." disabled={isSubmitting} />
                </label>

                <label class="submit-field">
                  <span>Short description</span>
                  <textarea bind:value={description} rows="4" required disabled={isSubmitting}></textarea>
                </label>

                <button type="submit" class="button secondary-button" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting…' : 'Submit Buddy'}
                </button>

                {#if errorMessage}
                  <p class="submit-error">{errorMessage}</p>
                {/if}
              </form>
            {/if}
          </div>
        </RoughFrame>
      </div>
    </div>
  </section>
</main>

<footer class="site-footer">
  <div class="section-shell footer-layout">
    <a href="https://hackclub.com">Hack Club</a>
    <a href="https://hackclub.com/privacy-and-terms">Privacy &amp; Terms</a>
    <a href="https://github.com/johnathanmcphilbin/Buddy" target="_blank" rel="noopener">GitHub</a>
  </div>
</footer>

<style>
  .submit-page {
    padding-bottom: clamp(40px, 6vw, 72px);
  }

  .submit-top {
    padding: clamp(48px, 7vw, 80px) clamp(18px, 4vw, 54px) clamp(24px, 4vw, 40px);
  }

  .submit-top-shell {
    display: grid;
    justify-items: start;
    gap: 14px;
  }

  .submit-page h1 {
    max-width: 640px;
    font-size: clamp(2.2rem, 4.4vw, 3.4rem);
    line-height: 1.05;
    font-weight: 800;
  }

  .submit-subhead {
    max-width: 620px;
    color: var(--muted);
    font-size: 1.05rem;
    line-height: 1.55;
    font-weight: 500;
  }

  .submit-hackatime {
    margin-top: 6px;
    width: fit-content;
  }

  .submit-hackatime-inner {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
  }

  .submit-hackatime-label {
    font-weight: 800;
    font-size: 0.72rem;
    letter-spacing: 0.04em;
    color: var(--muted);
  }

  .submit-hackatime-project {
    font-family: 'Kalam', cursive;
    font-weight: 700;
    font-size: 0.95rem;
  }

  .submit-hackatime-hours {
    font-weight: 700;
    font-size: 0.85rem;
    color: var(--blue);
  }

  .submit-hackatime-link {
    color: var(--ink);
    font-weight: 700;
    font-size: 0.85rem;
    text-decoration: underline;
    text-decoration-thickness: 2px;
    text-underline-offset: 3px;
  }

  .submit-form-section {
    padding-top: clamp(10px, 2vw, 20px);
  }

  .submit-form-frame :global(.rough-frame-content) {
    padding: 10px;
  }

  .submit-form-inner {
    border-radius: 18px;
    background: var(--white);
    padding: clamp(20px, 4vw, 36px);
  }

  .submit-form {
    display: grid;
    gap: 16px;
    max-width: 560px;
  }

  .submit-field-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }

  .submit-field {
    display: grid;
    gap: 6px;
    font-weight: 700;
    font-size: 0.88rem;
  }

  .submit-field input,
  .submit-field textarea {
    min-height: 46px;
    padding: 10px 14px;
    border: 2px solid var(--ink);
    border-radius: 12px;
    font-family: inherit;
    font-size: 0.95rem;
    font-weight: 500;
    background: var(--paper);
    color: var(--ink);
  }

  .submit-field textarea {
    min-height: 100px;
    resize: vertical;
  }

  .submit-error {
    color: var(--red);
    font-size: 0.88rem;
    font-weight: 600;
  }

  .submit-locked {
    display: grid;
    gap: 14px;
    justify-items: start;
    max-width: 420px;
  }

  .submit-locked p {
    color: var(--muted);
    font-weight: 500;
  }

  .submit-success {
    display: grid;
    gap: 10px;
    justify-items: start;
  }

  .submit-success .scribble {
    font-size: 1.6rem;
    color: var(--green);
  }

  .submit-success p {
    color: var(--muted);
    font-weight: 500;
    max-width: 420px;
  }
</style>
