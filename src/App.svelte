<script>
  import { onMount } from 'svelte';
  import { gsap } from 'gsap';
  import Mascot from './lib/Mascot.svelte';
  import RoughDivider from './lib/RoughDivider.svelte';
  import RoughFrame from './lib/RoughFrame.svelte';
  import ShowcaseStill from './lib/ShowcaseStill.svelte';
  import StepGraphic from './lib/StepGraphic.svelte';
  import BuildVisual from './lib/BuildVisual.svelte';
  import StepArrow from './lib/StepArrow.svelte';
  import WorkedExample from './lib/WorkedExample.svelte';

  const brandColors = ['#ec3750', '#ff8c37', '#f1c40f', '#33d6a6', '#338eda', '#a633d6'];

  const buildSteps = [
    {
      title: 'Take some photos.',
      before: 'Pick 3 to 5 things Buddy should recognize and photograph them in different positions, angles, and combinations.',
      accent: '#ec3750',
      kind: 'photos'
    },
    {
      title: 'Train your detector.',
      before: 'Upload your photos to ',
      link: 'Roboflow',
      after: ', draw boxes around each object, and train a model to recognize them.',
      accent: '#ff8c37',
      kind: 'boxes'
    },
    {
      title: 'Give Buddy some logic.',
      before: 'Write the rules that turn what Buddy sees into what it should understand. Keys + phone but no wallet? Buddy knows you forgot something.',
      accent: '#33d6a6',
      kind: 'logic'
    },
    {
      title: 'Make Buddy talk.',
      before: 'Connect those rules to browser text to speech, run it live through your webcam, and make Buddy say the right thing out loud.',
      accent: '#338eda',
      kind: 'speech'
    }
  ];

  const showcaseCards = [
    { palette: ['#ec3750', '#338eda', '#33d6a6'], seed: 101 },
    { palette: ['#ff8c37', '#a633d6', '#f1c40f'], seed: 111 },
    { palette: ['#33d6a6', '#ec3750', '#338eda'], seed: 121 },
    { palette: ['#338eda', '#f1c40f', '#a633d6'], seed: 131 },
    { palette: ['#a633d6', '#33d6a6', '#ff8c37'], seed: 141 },
    { palette: ['#f1c40f', '#338eda', '#ec3750'], seed: 151 }
  ];

  const faqs = Array.from({ length: 8 }, (_, index) => index);
  let openFaq = 0;
  let heroCta;

  function bounceCta() {
    gsap.fromTo(
      heroCta,
      { scale: 1 },
      { scale: 1.08, duration: 0.18, repeat: 1, yoyo: true, ease: 'back.out(4)' }
    );
  }

  onMount(() => {
    gsap.fromTo(
      heroCta,
      { scale: 0.86, rotate: -1.5 },
      { scale: 1, rotate: 0, duration: 0.78, delay: 0.25, ease: 'back.out(3.4)' }
    );
  });
</script>

<svelte:head>
  <meta
    name="description"
    content="Buddy, a Hack Club teen program landing page with placeholder copy."
  />
</svelte:head>

<header class="site-header">
  <a class="brand-lockup" href="#top" aria-label="Buddy">
    <img src="https://assets.hackclub.com/flag-orpheus-top.svg" alt="Hack Club" />
    <span>Buddy</span>
  </a>
  <nav aria-label="Primary">
    <a href="#how">[NAV HOW]</a>
    <a href="#example">[NAV EXAMPLE]</a>
    <a href="#showcase">[NAV SHOWCASE]</a>
    <a href="#faq">[NAV FAQ]</a>
  </nav>
  <a class="age-pill" href="#reward">
    <RoughFrame variant="brackets" stroke="#ec3750" seed={12} inset={4} bracketLength={18}>
      <span>[AGES 13-18]</span>
    </RoughFrame>
  </a>
</header>

<main id="top">
  <section class="section hero-section">
    <div class="section-shell hero-grid">
      <div class="hero-copy">
        <p class="eyebrow">A Hackclub YSWS: Buddy</p>
        <h1>Your computer can see you. Now make it understand you.</h1>
        <p class="hero-subhead">Train it on your stuff, teach it what different situations mean, and build an assistant that talks back based on what it sees.</p>

        <div class="cta-wrap" bind:this={heroCta}>
          <a class="button hero-button" href="#example" on:mouseenter={bounceCta} on:focus={bounceCta}>
            <span>See demo ->></span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12h12" />
              <path d="m13 6 6 6-6 6" />
            </svg>
          </a>
        </div>

        <div class="hook-card">
          <RoughFrame stroke="#a633d6" fill="#ffffff" seed={45} radius={22} roughness={2}>
            <span class="scribble">SHOW YOUR BUDDY YOUR WORLD</span>
            <p>Your Buddy turns what it sees into something it understands, then decides what to say about it.</p>
          </RoughFrame>
        </div>
      </div>

      <div class="hero-visual">
        <RoughFrame stroke="#ff8c37" fill="#fffdf6" seed={19} radius={34} roughness={2.4}>
          <div class="hero-stage">
            <div class="brand-bursts" aria-hidden="true">
              {#each brandColors as color, index}
                <span style={`--burst:${color};--i:${index}`}></span>
              {/each}
            </div>
            <Mascot state="confused" size={236} />
          </div>
        </RoughFrame>
      </div>
    </div>
  </section>

  <section class="section how-section" id="how">
    <div class="section-shell">
      <div class="section-heading">
        <p class="eyebrow">HOW IT WORKS</p>
        <h2>From photos to a talking Buddy.</h2>
        <p class="section-lede">You’ll train your own object detector in Roboflow, plug it into a starter webpage, then write the logic that gives Buddy something to say.</p>
      </div>

      <div class="build-flow">
        {#each buildSteps as step, index}
          <div class="build-step">
            <span class="build-step-number">{String(index + 1).padStart(2, '0')}</span>
            <div class="build-step-body">
              <h3>{step.title}</h3>
              <p>{step.before}{#if step.link}<a href="https://roboflow.com/" target="_blank" rel="noopener">{step.link}</a>{step.after}{/if}</p>
            </div>
            <div class="build-step-visual">
              <BuildVisual kind={step.kind} accent={step.accent} />
            </div>
          </div>
          {#if index < buildSteps.length - 1}
            <div class="build-connector">
              <StepArrow />
            </div>
          {/if}
        {/each}
      </div>
    </div>
  </section>

  <WorkedExample />

  <section class="section showcase-section" id="showcase">
    <div class="section-shell">
      <div class="section-heading split-heading">
        <div>
          <p class="eyebrow">[SHOWCASE LABEL]</p>
          <h2>[SHOWCASE HEADLINE]</h2>
        </div>
        <p class="section-lede">[SHOWCASE SUBHEAD]</p>
      </div>

      <div class="showcase-grid">
        {#each showcaseCards as card, index}
          <article class="submission-card">
            <RoughFrame stroke={card.palette[0]} fill="#ffffff" seed={card.seed} radius={22} roughness={2}>
              <div class="submission-inner">
                <ShowcaseStill palette={card.palette} seed={card.seed} />
                <div class="submission-meta">
                  <div>
                    <h3>[NAME]</h3>
                    <p>[AGE] / [LOCATION]</p>
                  </div>
                  <span class="mini-dot" style={`--dot:${card.palette[1]}`}></span>
                </div>
                <p class="submission-description">[SUBMISSION DESCRIPTION]</p>
              </div>
            </RoughFrame>
          </article>
        {/each}
      </div>
    </div>
  </section>

  <section class="section reward-section" id="reward">
    <div class="section-shell reward-layout">
      <div class="reward-copy">
        <p class="eyebrow">[REWARD LABEL]</p>
        <h2>[REWARD HEADLINE]</h2>
        <p class="section-lede">[REWARD DESCRIPTION]</p>
      </div>
      <div class="reward-prize">
        <RoughFrame variant="brackets" stroke="#a633d6" seed={93} inset={4} bracketLength={44}>
          <div class="prize-graphic" aria-label="[PRIZE IMAGE]">
            <StepGraphic type="reward" accent="#ec3750" secondary="#338eda" />
          </div>
        </RoughFrame>
      </div>
    </div>
  </section>

  <section class="section faq-section" id="faq">
    <div class="section-shell faq-layout">
      <div class="section-heading faq-heading">
        <p class="eyebrow">[FAQ LABEL]</p>
        <h2>[FAQ HEADLINE]</h2>
      </div>

      <div class="faq-list">
        {#each faqs as faq}
          <div class="faq-item">
            <button
              class="faq-question"
              aria-expanded={openFaq === faq}
              aria-controls={`faq-${faq}`}
              on:click={() => (openFaq = openFaq === faq ? -1 : faq)}
            >
              <span>[FAQ QUESTION]</span>
              <span class="faq-icon" aria-hidden="true">{openFaq === faq ? '-' : '+'}</span>
            </button>
            <RoughDivider height={18} colors={[brandColors[faq % brandColors.length], brandColors[(faq + 2) % brandColors.length]]} />
            {#if openFaq === faq}
              <div class="faq-answer" id={`faq-${faq}`}>
                <p>[FAQ ANSWER]</p>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  </section>
</main>

<footer class="site-footer">
  <div class="section-shell footer-layout">
    <div class="footer-brand">
      <img src="https://assets.hackclub.com/flag-orpheus-top.svg" alt="Hack Club" />
      <h2>Buddy</h2>
      <p>[HACK CLUB BRANDING LINE]</p>
    </div>

    <div class="footer-links">
      <div>
        <h3>[FOOTER GROUP]</h3>
        <a href="#how">[FOOTER LINK]</a>
        <a href="#example">[FOOTER LINK]</a>
      </div>
      <div>
        <h3>[FOOTER GROUP]</h3>
        <a href="#showcase">[FOOTER LINK]</a>
        <a href="#faq">[FOOTER LINK]</a>
      </div>
      <div>
        <h3>[FOOTER GROUP]</h3>
        <a href="https://hackclub.com">[FOOTER LINK]</a>
        <a href="https://blueprint.hackclub.com">[FOOTER LINK]</a>
      </div>
    </div>

    <div class="footer-mascot">
      <Mascot state="idle" size={128} />
    </div>
  </div>
</footer>
