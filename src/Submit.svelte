<script>
  import { onMount } from 'svelte';
  import RoughFrame from './lib/RoughFrame.svelte';

  const MINIMUM_PROJECT_HOURS = 2;

  let status = { connected: false, project: null, hours: 0 };
  let isLoading = true;
  let isSubmitting = false;
  let submitted = false;
  let errorMessage = '';

  let codeUrl = '';
  let playableUrl = '';
  let howHeard = '';
  let doingWell = '';
  let howImprove = '';
  let firstName = '';
  let lastName = '';
  let email = '';
  let screenshotFile = null;
  let screenshotName = '';
  let description = '';
  let githubUsername = '';
  let addressLine1 = '';
  let addressLine2 = '';
  let city = '';
  let stateProvince = '';
  let country = '';
  let zip = '';
  let birthday = '';
  let roboflowUrl = '';

  const MAX_SCREENSHOT_DIMENSION = 1600;

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

  function handleScreenshotChange(event) {
    screenshotFile = event.target.files?.[0] ?? null;
    screenshotName = screenshotFile?.name ?? '';
  }

  // Resized client-side so a full-resolution phone photo doesn't blow
  // past the request size limit on the way to the server.
  function resizeImageToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Could not read the screenshot file.'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Could not read the screenshot file.'));
        img.onload = () => {
          const scale = Math.min(1, MAX_SCREENSHOT_DIMENSION / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(dataUrl.split(',')[1]);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    errorMessage = '';
    isSubmitting = true;

    try {
      let screenshot = null;
      if (screenshotFile) {
        screenshot = {
          base64: await resizeImageToBase64(screenshotFile),
          contentType: 'image/jpeg',
          filename: screenshotFile.name.replace(/\.[^.]+$/, '') + '.jpg'
        };
      }

      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codeUrl,
          playableUrl,
          howHeard,
          doingWell,
          howImprove,
          firstName,
          lastName,
          email,
          screenshot,
          description,
          githubUsername,
          addressLine1,
          addressLine2,
          city,
          stateProvince,
          country,
          zip,
          birthday,
          roboflowUrl
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
      <div class="heading-row">
        <h1>Submit your Buddy.</h1>
        <img class="heading-sticker" src="/images/buddy-glasses.png" alt="" aria-hidden="true" />
      </div>
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
            {:else if status.hours < MINIMUM_PROJECT_HOURS}
              <div class="submit-locked">
                <p>Log at least {MINIMUM_PROJECT_HOURS} hours on {status.project} before you can submit. You're at {status.hours.toFixed(1)} hours so far — keep building!</p>
              </div>
            {:else}
              <form class="submit-form" on:submit={handleSubmit}>
                <label class="submit-field">
                  <span>Code URL</span>
                  <input type="url" bind:value={codeUrl} placeholder="https://github.com/you/buddy" required disabled={isSubmitting} />
                </label>

                <label class="submit-field">
                  <span>Playable URL</span>
                  <input type="url" bind:value={playableUrl} placeholder="Link to your demo video or a live version" required disabled={isSubmitting} />
                  <span class="submit-field-hint">Must be a public, permanent URL with no login required. Not Streamlit; use Nest, Railway, Render, or Vercel instead.</span>
                </label>

                <label class="submit-field">
                  <span>Roboflow project URL (optional)</span>
                  <input type="url" bind:value={roboflowUrl} placeholder="https://app.roboflow.com/..." disabled={isSubmitting} />
                </label>

                <label class="submit-field">
                  <span>How did you hear about this?</span>
                  <input type="text" bind:value={howHeard} disabled={isSubmitting} />
                </label>

                <label class="submit-field">
                  <span>What are we doing well?</span>
                  <input type="text" bind:value={doingWell} disabled={isSubmitting} />
                </label>

                <label class="submit-field">
                  <span>How can we improve?</span>
                  <input type="text" bind:value={howImprove} disabled={isSubmitting} />
                </label>

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

                <label class="submit-field">
                  <span>Screenshot (optional)</span>
                  <input type="file" accept="image/*" on:change={handleScreenshotChange} disabled={isSubmitting} />
                  {#if screenshotName}<span class="submit-field-hint">{screenshotName}</span>{/if}
                </label>

                <label class="submit-field">
                  <span>Description</span>
                  <textarea bind:value={description} rows="4" required disabled={isSubmitting}></textarea>
                </label>

                <label class="submit-field">
                  <span>GitHub username</span>
                  <input type="text" bind:value={githubUsername} required disabled={isSubmitting} />
                </label>

                <label class="submit-field">
                  <span>Address (Line 1)</span>
                  <input type="text" bind:value={addressLine1} required disabled={isSubmitting} />
                </label>

                <label class="submit-field">
                  <span>Address (Line 2, optional)</span>
                  <input type="text" bind:value={addressLine2} disabled={isSubmitting} />
                </label>

                <div class="submit-field-row">
                  <label class="submit-field">
                    <span>City</span>
                    <input type="text" bind:value={city} required disabled={isSubmitting} />
                  </label>
                  <label class="submit-field">
                    <span>State / Province</span>
                    <input type="text" bind:value={stateProvince} required disabled={isSubmitting} />
                  </label>
                </div>

                <div class="submit-field-row">
                  <label class="submit-field">
                    <span>Country</span>
                    <input type="text" bind:value={country} required disabled={isSubmitting} />
                  </label>
                  <label class="submit-field">
                    <span>ZIP / Postal Code</span>
                    <input type="text" bind:value={zip} required disabled={isSubmitting} />
                  </label>
                </div>

                <label class="submit-field">
                  <span>Birthday</span>
                  <input type="date" bind:value={birthday} required disabled={isSubmitting} />
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
    <a href="https://callum-moody.carrd.co/" target="_blank" rel="noopener">Art by Callum Moody</a>
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

  .submit-field-hint {
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--muted);
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
