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
  import BuddyLevel from './lib/BuddyLevel.svelte';

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

  const faqs = [
    {
      question: 'Do I need to know machine learning?',
      answer: 'No. You’ll use Roboflow to train the detector, and we’ll give you starter code for the webcam, model loading, and bounding boxes. The main thing you’re building is the logic that makes Buddy understand what it sees and decide what to say.'
    },
    {
      question: 'Do I have to train my own model?',
      answer: 'Yes. Your detector has to be trained on photos you collected and labelled yourself. No stock datasets and no wrapping a general vision API around your project.'
    },
    {
      question: 'What does a finished Buddy need to do?',
      answer: 'Your Buddy needs to detect multiple objects at once, react differently to combinations or counts of those objects, and speak a response out loud based on what it currently sees.'
    },
    {
      question: 'How many responses does Buddy need?',
      answer: 'At least 6 distinct spoken outcomes. They should depend on different combinations, missing objects, or counts, not just one object being present.'
    },
    {
      question: 'How long should this take?',
      answer: 'Around 4 to 5 hours for the base Buddy. You can keep building after that to earn more Bits and upgrade it further.'
    },
    {
      question: 'What are Bits?',
      answer: 'Every hour you work earns you 1 Bit. One Bit represents $5 of reward value, and you can spend your Bits in the Buddy Shop on upgrades like AI credits, a webcam, a custom voice, hardware, and more.'
    },
    {
      question: 'How do I track my hours?',
      answer: 'Use Lapse or Hackatime to track the time you spend building Buddy. Your logged hours are what convert into Bits, so keep it running while you work.'
    },
    {
      question: 'Do I need an LLM or paid AI API?',
      answer: 'No. The normal Buddy uses rules you write yourself. AI generated responses are an optional upgrade if you want to take it further.'
    },
    {
      question: 'What do I submit?',
      answer: 'A working live webcam demo, your Roboflow project or dataset, and a short video showing Buddy detecting multiple objects and speaking different responses based on what it sees.'
    }
  ];
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
  <div class="brand-lockup">
    <a class="hackclub-flag-link" href="https://hackclub.com" target="_blank" rel="noopener" aria-label="Hack Club">
      <img class="hackclub-flag" src="/images/hackclub-flag.svg" alt="Hack Club" />
    </a>
    <a href="#top" aria-label="Buddy">
      <span>Buddy</span>
    </a>
  </div>
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
            <span>See demo</span>
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
            <img class="hero-stage-image" src="/images/demo.png" alt="Example Buddy detection with objects boxed and labeled" />
          </div>
        </RoughFrame>
        <img class="hero-buddy-badge" src="/images/buddy.png" alt="Buddy" />
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
        <p class="shop-teaser-tracking">
          <img class="shop-teaser-tracking-icon" src="/images/buddy.png" alt="" aria-hidden="true" />
          Tracked with Lapse and Hackatime.
        </p>
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

  <BuddyLevel />

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
        <p class="eyebrow">FAQ</p>
        <h2>Before you start.</h2>
      </div>

      <div class="faq-list">
        {#each faqs as faq, index}
          <div class="faq-item">
            <button
              class="faq-question"
              aria-expanded={openFaq === index}
              aria-controls={`faq-${index}`}
              on:click={() => (openFaq = openFaq === index ? -1 : index)}
            >
              <span>{faq.question}</span>
              <span class="faq-icon" aria-hidden="true">{openFaq === index ? '-' : '+'}</span>
            </button>
            <RoughDivider height={18} colors={[brandColors[index % brandColors.length], brandColors[(index + 2) % brandColors.length]]} />
            {#if openFaq === index}
              <div class="faq-answer" id={`faq-${index}`}>
                <p>{faq.answer}</p>
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
    <a href="https://hackclub.com">Hack Club</a>
    <a href="https://hackclub.com/privacy-and-terms">Privacy &amp; Terms</a>
  </div>
</footer>
