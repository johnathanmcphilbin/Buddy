<script>
  import { onDestroy, tick } from 'svelte';
  import rough from 'roughjs/bundled/rough.esm.js';
  import RoughFrame from './RoughFrame.svelte';

  const CLASS_COLORS = {
    KEYBOARD: '#ff8c37',
    MOUSE: '#33d6a6'
  };

  const ALLOWED_CLASSES = Object.keys(CLASS_COLORS);
  const CONFIDENCE_THRESHOLD = 0.6;
  const STABLE_MS = 1000;

  const RESPONSES = {
    'KEYBOARD,MOUSE': 'You’ve got everything. Your desk is ready.',
    'KEYBOARD': 'You’ve got your keyboard. That is not enough.',
    'MOUSE': 'You’ve got your mouse. That is not enough.',
    '': 'Your desk is completely empty.'
  };

  const ROBOFLOW_CONFIG = {
    // Roboflow's workflow endpoint doesn't send CORS headers on its
    // preflight response, so browsers block calling it directly. This
    // relative path is proxied to the real endpoint (see vite.config.js
    // for local dev; the production host needs an equivalent proxy/function).
    workflowUrl: '/api/roboflow',
    apiKey: 'szXTZuJgiRiFkpwoN7eQ'
  };

  const INFERENCE_INTERVAL_MS = 500;

  let video;
  let canvas;
  let frameCanvas;
  let cameraWrap;
  let resizeObserver;

  let stream;
  let model;
  let loopTimer;
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
    // The Roboflow workflow is a stateless HTTP endpoint, so "loading"
    // just means the config we need to call it is ready.
    if (!ROBOFLOW_CONFIG.workflowUrl || !ROBOFLOW_CONFIG.apiKey) return null;
    return ROBOFLOW_CONFIG;
  }

  // --- frame inference --------------------------------------------------

  function captureFrameAsBase64(videoEl) {
    if (!videoEl?.videoWidth || !videoEl?.videoHeight) return null;

    frameCanvas = frameCanvas || document.createElement('canvas');
    frameCanvas.width = videoEl.videoWidth;
    frameCanvas.height = videoEl.videoHeight;

    const ctx = frameCanvas.getContext('2d');
    ctx.drawImage(videoEl, 0, 0, frameCanvas.width, frameCanvas.height);

    return frameCanvas.toDataURL('image/jpeg', 0.8).split(',')[1] ?? null;
  }

  // Roboflow workflow output shapes vary by workflow config, so this
  // walks the response looking for the first array of detection-shaped
  // objects instead of hardcoding one exact path.
  function findPredictionsArray(node, depth = 0) {
    if (!node || depth > 6) return null;

    if (Array.isArray(node)) {
      const looksLikeDetections = node.every(
        (entry) => entry && typeof entry === 'object' && ('confidence' in entry) && ('class' in entry || 'class_name' in entry || 'label' in entry)
      );
      if (node.length > 0 && looksLikeDetections) return node;

      for (const entry of node) {
        const found = findPredictionsArray(entry, depth + 1);
        if (found) return found;
      }
      return null;
    }

    if (typeof node === 'object') {
      for (const key of Object.keys(node)) {
        const found = findPredictionsArray(node[key], depth + 1);
        if (found) return found;
      }
    }

    return null;
  }

  async function runFrameInference(activeModel, videoEl) {
    if (!activeModel) return [];

    const base64Image = captureFrameAsBase64(videoEl);
    if (!base64Image) return [];

    try {
      const response = await fetch(activeModel.workflowUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: activeModel.apiKey,
          inputs: {
            image: { type: 'base64', value: base64Image }
          }
        })
      });

      if (!response.ok) return [];

      const data = await response.json();
      return findPredictionsArray(data) ?? [];
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  // --- detection state --------------------------------------------------

  function updateDetectionState(rawPredictions) {
    const bestByClass = new Map();

    rawPredictions.forEach((prediction) => {
      const label = String(prediction.class ?? prediction.class_name ?? prediction.label ?? '').toUpperCase();
      const score = prediction.confidence ?? prediction.score ?? 0;

      if (!ALLOWED_CLASSES.includes(label)) return;
      if (score < CONFIDENCE_THRESHOLD) return;

      const existing = bestByClass.get(label);
      if (!existing || score > existing.score) {
        // Roboflow reports x/y as the box center; bbox arrays (if ever
        // present) are already top-left, so only convert the former.
        const width = prediction.width ?? prediction.bbox?.[2] ?? 0;
        const height = prediction.height ?? prediction.bbox?.[3] ?? 0;
        const x = prediction.bbox ? prediction.bbox[0] : (prediction.x ?? 0) - width / 2;
        const y = prediction.bbox ? prediction.bbox[1] : (prediction.y ?? 0) - height / 2;

        bestByClass.set(label, { label, score, x, y, width, height });
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
    if (stopRequested || !isRunning) return;

    detections = updateDetectionState(rawPredictions);
    drawBoundingBoxes(detections);
    handleComboStability(getComboKey(detections));

    loopTimer = setTimeout(frameLoop, INFERENCE_INTERVAL_MS);
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
    clearTimeout(loopTimer);
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
      <h2>Is your desk ready to work?</h2>
      <p class="section-lede">This Buddy checks your desk for your keyboard and mouse before you sit down to work.</p>
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
