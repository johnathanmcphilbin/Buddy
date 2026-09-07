<script>
  import { onMount } from 'svelte';
  import { gsap } from 'gsap';
  import Mascot from './lib/Mascot.svelte';
  import RoughDivider from './lib/RoughDivider.svelte';
  import RoughFrame from './lib/RoughFrame.svelte';
  import ShowcaseStill from './lib/ShowcaseStill.svelte';
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
    {
      palette: ['#ec3750', '#338eda', '#33d6a6'],
      seed: 101,
      title: 'Ready to Leave',
      description: 'Checks for your keys, phone, wallet, and bag, then tells you what you forgot before you walk out the door.'
    },
    {
      palette: ['#ff8c37', '#a633d6', '#f1c40f'],
      seed: 111,
      title: 'Study Buddy',
      description: 'Looks at your desk and tells you if you’re missing your laptop, notebook, calculator, or pens.'
    },
    {
      palette: ['#33d6a6', '#ec3750', '#338eda'],
      seed: 121,
      title: 'Hand Sign Controller',
      description: 'Recognizes different hand signs and turns them into commands, like changing music, starting a timer, or making Buddy say something back.'
    },
    {
      palette: ['#338eda', '#f1c40f', '#a633d6'],
      seed: 131,
      title: 'Card Counter',
      description: 'Recognizes cards as you show them to the camera, keeps a running count, and reads the total out loud.'
    },
    {
      palette: ['#a633d6', '#33d6a6', '#ff8c37'],
      seed: 141,
      title: 'Snack Patrol',
      description: 'Notices what food keeps appearing on your desk and starts commenting when the same thing shows up again.'
    },
    {
      palette: ['#f1c40f', '#338eda', '#ec3750'],
      seed: 151,
      title: 'Room Checker',
      description: 'Looks around a space and tells you if certain things are there, missing, or out of place.'
    }
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
    <a href="#how">How it works</a>
    <a href="#example">Try a Buddy</a>
    <a href="#showcase">Ideas</a>
    <a href="#faq">FAQ</a>
    <a href="/shop.html">Shop</a>
  </nav>
  <a class="age-pill" href="/shop.html">
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

  <section class="section shop-teaser-section" id="shop-teaser">
    <div class="section-shell shop-teaser-grid">
      <div class="shop-teaser-copy">
        <p class="eyebrow">THE BUDDY SHOP</p>
        <h2>Build more. Upgrade your Buddy.</h2>
        <p class="section-lede">Every hour you work earns you 1 Bit. Spend your Bits on things that help you take Buddy further, like a better webcam, AI credits, a microphone, Roboflow credits, or hardware.</p>
        <p class="shop-teaser-rate">1 HOUR = 1 BIT</p>
        <a class="button secondary-button shop-teaser-cta" href="/shop.html">Visit the shop →</a>
      </div>

      <div class="shop-teaser-diagram">
        <svg class="shop-teaser-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d="M22 20 C 30 28, 38 34, 47 46" fill="none" stroke="#ec3750" stroke-width="0.6" stroke-linecap="round" />
          <path d="M78 16 C 68 24, 60 32, 52 44" fill="none" stroke="#ff8c37" stroke-width="0.6" stroke-linecap="round" />
          <path d="M76 74 C 66 68, 60 62, 54 54" fill="none" stroke="#338eda" stroke-width="0.6" stroke-linecap="round" />
        </svg>

        <div class="shop-teaser-buddy">
          <Mascot state="idle" size={128} />
          <span class="shop-teaser-buddy-label">BUDDY</span>
        </div>

        <div class="shop-teaser-tag shop-teaser-tag-webcam">
          <span class="shop-teaser-tag-label">WEBCAM</span>
          <span class="shop-teaser-tag-price">8 Bits</span>
        </div>

        <div class="shop-teaser-tag shop-teaser-tag-brain">
          <span class="shop-teaser-tag-label">AI BRAIN</span>
          <span class="shop-teaser-tag-price">2 Bits</span>
        </div>

        <div class="shop-teaser-tag shop-teaser-tag-mic">
          <span class="shop-teaser-tag-label">MICROPHONE</span>
          <span class="shop-teaser-tag-price">7 Bits</span>
        </div>
      </div>
    </div>
  </section>

  <WorkedExample />

  <section class="section showcase-section" id="showcase">
    <div class="section-shell">
      <div class="section-heading split-heading">
        <div>
          <p class="eyebrow">IDEAS TO STEAL</p>
          <h2>What could your Buddy do?</h2>
        </div>
        <p class="section-lede">Here are a few things you could build. Start with one of these, remix it, or make something completely different.</p>
      </div>

      <div class="showcase-grid">
        {#each showcaseCards as card, index}
          <article class="submission-card">
            <RoughFrame stroke={card.palette[0]} fill="#ffffff" seed={card.seed} radius={22} roughness={2}>
              <div class="submission-inner">
                <ShowcaseStill palette={card.palette} seed={card.seed} variant={index} />
                <div class="submission-meta">
                  <div>
                    <h3>{card.title}</h3>
                    <p>PROJECT IDEA</p>
                  </div>
                  <span class="mini-dot" style={`--dot:${card.palette[1]}`}></span>
                </div>
                <p class="submission-description">{card.description}</p>
              </div>
            </RoughFrame>
          </article>
        {/each}
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
