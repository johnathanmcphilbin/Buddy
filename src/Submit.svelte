<script>
  import RoughFrame from './lib/RoughFrame.svelte';
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
    </div>
  </section>

  <section class="section submit-form-section">
    <div class="section-shell">
      <div class="submit-form-frame">
        <RoughFrame stroke="#33d6a6" fill="#fffdf6" seed={64} radius={26} roughness={2}>
          <div class="submit-form-inner">
            <iframe
              class="airtable-embed"
              src="https://airtable.com/embed/appaLihQJMPIKOV12/pagIUkO2i3lr1KlNc/form"
              title="Submit your Buddy"
              loading="lazy"
            ></iframe>
          </div>
        </RoughFrame>
      </div>
      <p class="submit-fallback">
        Having trouble with the form?
        <a href="https://airtable.com/appaLihQJMPIKOV12/pagIUkO2i3lr1KlNc/form" target="_blank" rel="noopener">Open it in a new tab</a>.
      </p>
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

  .submit-form-section {
    padding-top: clamp(10px, 2vw, 20px);
  }

  .submit-form-frame :global(.rough-frame-content) {
    padding: 10px;
  }

  .submit-form-inner {
    border-radius: 18px;
    overflow: hidden;
    background: var(--white);
  }

  .airtable-embed {
    display: block;
    width: 100%;
    height: min(1100px, 90vh);
    border: none;
  }

  .submit-fallback {
    margin-top: 14px;
    color: var(--muted);
    font-size: 0.92rem;
    font-weight: 500;
  }

  .submit-fallback a {
    color: var(--ink);
    font-weight: 700;
    text-decoration: underline;
    text-decoration-thickness: 2px;
    text-underline-offset: 3px;
  }
</style>
