<script>
  import { onDestroy, tick } from 'svelte';
  import rough from 'roughjs/bundled/rough.esm.js';
  import RoughFrame from './RoughFrame.svelte';

  const CLASS_COLORS = {
    KEYS: '#ec3750',
    PHONE: '#ff8c37',
    WALLET: '#33d6a6',
    BAG: '#338eda'
  };

  const ALLOWED_CLASSES = Object.keys(CLASS_COLORS);
  const CONFIDENCE_THRESHOLD = 0.6;
  const STABLE_MS = 1000;

  const RESPONSES = {
    'KEYS,PHONE,WALLET,BAG': 'You’ve got everything. You’re good to go.',
    'KEYS,PHONE,BAG': 'You’ve got your keys, phone, and bag. You’re still missing your wallet.',
    'KEYS,PHONE': 'You’ve got your keys and phone, but you’re missing your wallet and bag.',
    'PHONE,WALLET': 'You’ve got your phone and wallet. You probably want your keys too.',
    'KEYS': 'You’ve got your keys. That is not enough.',
    '': 'You appear to have prepared absolutely nothing.'
  };

  // Roboflow hosted inference is not connected yet. Fill these in and
  // swap the body of runFrameInference() with a real call when a
  // trained model is ready. Detection state, drawing, and speech below
  // all work off whatever runFrameInference() returns, so nothing else
  // needs to change.
  const ROBOFLOW_CONFIG = {
    modelEndpoint: '',
    apiKey: ''
  };

  let video;
  let canvas;
  let cameraWrap;
  let resizeObserver;

  let stream;
  let model;
  let rafId;
  let stableTimer;

  let isRunning = false;
  let isLoading = false;
  let stopRequested = false;

  let detections = [];
  let status = '';
  let responseText = '';

  let pendingComboKey = null;
  let lastSpokenComboKey = null;

  // --- webcam setup -------------------------------------------------

  async function setupWebcam() {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        width: { ideal: 960 },
        height: { ideal: 540 },
        facingMode: 'user'
      }
    });

    await tick();
    video.srcObject = stream;
    await video.play();
  }

  function teardownWebcam() {
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
    if (video) video.srcObject = null;
  }

  // --- model loading --------------------------------------------------

  async function loadModel() {
    // Placeholder until a trained Roboflow model is connected. Returning
    // null keeps the demo honest: no detections are drawn or spoken for
    // until a real model is wired up here.
    return null;
  }

  // --- frame inference --------------------------------------------------

  async function runFrameInference(activeModel, videoEl) {
    if (!activeModel) return [];

    // Example of what this looks like once a Roboflow model is connected:
    // const response = await fetch(
    //   `${ROBOFLOW_CONFIG.modelEndpoint}?api_key=${ROBOFLOW_CONFIG.apiKey}`,
    //   { method: 'POST', body: frameToBlob(videoEl) }
    // );
    // const { predictions } = await response.json();
    // return predictions;

    return [];
  }

  // --- detection state --------------------------------------------------

  function updateDetectionState(rawPredictions) {
    const bestByClass = new Map();

    rawPredictions.forEach((prediction) => {
      const label = String(prediction.class ?? prediction.label ?? '').toUpperCase();
      const score = prediction.confidence ?? prediction.score ?? 0;

      if (!ALLOWED_CLASSES.includes(label)) return;
      if (score < CONFIDENCE_THRESHOLD) return;

      const existing = bestByClass.get(label);
      if (!existing || score > existing.score) {
        bestByClass.set(label, {
          label,
          score,
          x: prediction.x ?? prediction.bbox?.[0] ?? 0,
          y: prediction.y ?? prediction.bbox?.[1] ?? 0,
          width: prediction.width ?? prediction.bbox?.[2] ?? 0,
          height: prediction.height ?? prediction.bbox?.[3] ?? 0
        });
      }
    });

    return Array.from(bestByClass.values());
  }

  function getComboKey(currentDetections) {
    return ALLOWED_CLASSES.filter((label) => currentDetections.some((d) => d.label === label)).join(',');
  }

  // --- combination logic --------------------------------------------------

  function handleComboStability(comboKey) {
    if (comboKey !== pendingComboKey) {
      pendingComboKey = comboKey;
      clearTimeout(stableTimer);
      stableTimer = setTimeout(() => {
        if (comboKey === pendingComboKey && comboKey !== lastSpokenComboKey) {
          lastSpokenComboKey = comboKey;
          const response = RESPONSES[comboKey];
          if (response) speakResponse(response);
        }
      }, STABLE_MS);
    }
  }

  // --- speech output --------------------------------------------------

  function speakResponse(text) {
    window.speechSynthesis?.cancel();
    responseText = text;

    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  }

  // --- bounding box drawing --------------------------------------------------

  function setupCanvas() {
    const rect = cameraWrap?.getBoundingClientRect();
    if (!rect) return null;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    return { ctx, width: rect.width, height: rect.height, rc: rough.canvas(canvas) };
  }

  function clearCanvas() {
    setupCanvas();
  }

  function drawBoundingBoxes(currentDetections) {
    const setup = setupCanvas();
    if (!setup || !video?.videoWidth || !video?.videoHeight) return;

    const { ctx, width, height, rc } = setup;
    const scale = Math.max(width / video.videoWidth, height / video.videoHeight);
    const drawnWidth = video.videoWidth * scale;
    const drawnHeight = video.videoHeight * scale;
    const offsetX = (width - drawnWidth) / 2;
    const offsetY = (height - drawnHeight) / 2;

    currentDetections.forEach((detection, index) => {
      const color = CLASS_COLORS[detection.label] || '#26324d';
      const boxWidth = detection.width * scale;
      const boxHeight = detection.height * scale;
      const rawX = offsetX + detection.x * scale;
      const y = offsetY + detection.y * scale;
      // the video preview is mirrored (selfie style), so boxes are
      // mirrored to match rather than flipping the whole canvas
      const x = width - rawX - boxWidth;
      const labelText = `${detection.label} ${Math.round(detection.score * 100)}%`;

      rc.rectangle(x, y, boxWidth, boxHeight, {
        stroke: color,
        strokeWidth: 3.5,
        roughness: 2.6,
        bowing: 1.6,
        seed: index + 70
      });

      ctx.font = '700 14px Space Grotesk';
      const labelWidth = ctx.measureText(labelText).width + 18;
      const labelHeight = 26;
      const labelY = Math.max(8, y - labelHeight - 4);

      rc.rectangle(x, labelY, labelWidth, labelHeight, {
        stroke: color,
        strokeWidth: 2,
        roughness: 2.1,
        fill: '#fdfbf5',
        fillStyle: 'solid',
        seed: index + 90
      });

      ctx.fillStyle = '#26324d';
      ctx.fillText(labelText, x + 9, labelY + 18);
    });
  }

  // --- main loop --------------------------------------------------

  async function frameLoop() {
    if (stopRequested || !isRunning) return;

    const rawPredictions = await runFrameInference(model, video);
    detections = updateDetectionState(rawPredictions);
    drawBoundingBoxes(detections);
    handleComboStability(getComboKey(detections));

    rafId = requestAnimationFrame(frameLoop);
  }

  async function startDemo() {
    if (isRunning || isLoading) return;

    isLoading = true;
    stopRequested = false;
    responseText = '';
    lastSpokenComboKey = null;
    pendingComboKey = null;

    try {
      await setupWebcam();
      model = await loadModel();

      isRunning = true;
      isLoading = false;
      status = 'LIVE';

      resizeObserver = resizeObserver || new ResizeObserver(() => drawBoundingBoxes(detections));
      resizeObserver.observe(cameraWrap);

      frameLoop();
    } catch (error) {
      console.error(error);
      isLoading = false;
      isRunning = false;
      status = '';
    }
  }

  function stopDemo() {
    stopRequested = true;
    isRunning = false;
    isLoading = false;
    detections = [];
    status = '';
    responseText = '';
    pendingComboKey = null;
    lastSpokenComboKey = null;

    clearTimeout(stableTimer);
    cancelAnimationFrame(rafId);
    window.speechSynthesis?.cancel();
    resizeObserver?.disconnect();
    clearCanvas();
    teardownWebcam();
  }

  onDestroy(() => {
    stopDemo();
  });
</script>

<section class="section worked-section" id="example">
  <div class="section-shell worked-layout">
    <div class="worked-copy">
      <p class="eyebrow">TRY A BUDDY</p>
      <h2>Are you ready to leave?</h2>
      <p class="section-lede">This Buddy checks for the stuff you usually forget before you walk out the door.</p>
      <div class="example-actions">
        <button class="button secondary-button" on:click={startDemo} disabled={isLoading || isRunning}>
          {isLoading ? '[LOADING]' : 'Start camera'}
        </button>
        <button class="button quiet-button" on:click={stopDemo} disabled={!isRunning && !isLoading}>
          Stop demo
        </button>
      </div>
      <div class="example-readout" aria-live="polite">
        <RoughFrame stroke="#33d6a6" fill="#fdfbf5" seed={81} radius={18}>
          <span>{status}</span>
          <strong>{detections.length}</strong>
          <span>detections</span>
        </RoughFrame>
      </div>
    </div>

    <div class="worked-demo">
      <RoughFrame stroke="#f1c40f" fill="#fdfbf5" seed={54} radius={28} roughness={2.1}>
        <div class="camera-wrap" bind:this={cameraWrap}>
          {#if stream}
            <video bind:this={video} muted playsinline></video>
          {/if}
          <canvas bind:this={canvas} class="detection-layer" aria-hidden="true"></canvas>
          {#if !stream}
            <div class="camera-empty">[WEBCAM PLACEHOLDER]</div>
          {/if}
        </div>
      </RoughFrame>
      <p class="scribble caption-note" aria-live="polite">{responseText}</p>
    </div>
  </div>
</section>
