<script>
  import { onDestroy, tick } from 'svelte';
  import { gsap } from 'gsap';
  import rough from 'roughjs/bundled/rough.esm.js';
  import RoughFrame from './RoughFrame.svelte';

  const brandColors = ['#ec3750', '#ff8c37', '#f1c40f', '#33d6a6', '#338eda', '#a633d6'];

  let video;
  let canvas;
  let panel;
  let detector;
  let stream;
  let isRunning = false;
  let isLoading = false;
  let detections = [];
  let status = 'LIVE';
  let mascotState = 'idle';
  let lockedOnce = false;
  let stopRequested = false;

  function waitForMl5() {
    return new Promise((resolve, reject) => {
      if (window.ml5?.objectDetector) {
        resolve(window.ml5);
        return;
      }

      const startedAt = Date.now();
      const interval = setInterval(() => {
        if (window.ml5?.objectDetector) {
          clearInterval(interval);
          resolve(window.ml5);
        }

        if (Date.now() - startedAt > 12000) {
          clearInterval(interval);
          reject(new Error('ml5 unavailable'));
        }
      }, 120);
    });
  }

  function createDetector(ml5) {
    return new Promise((resolve, reject) => {
      let settled = false;
      let candidate;

      const done = (model) => {
        if (settled) return;
        settled = true;
        resolve(model || candidate);
      };

      try {
        candidate = ml5.objectDetector('cocossd', {}, () => done(candidate));

        if (candidate?.then) {
          candidate.then(done).catch(reject);
        }

        if (candidate?.detect) {
          setTimeout(() => done(candidate), 5500);
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  async function startDemo() {
    if (isRunning || isLoading) return;

    isLoading = true;
    stopRequested = false;
    status = '[CAMERA STATUS]';
    mascotState = 'confused';

    try {
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

      status = '[MODEL STATUS]';
      const ml5 = await waitForMl5();
      detector = detector || (await createDetector(ml5));

      isRunning = true;
      isLoading = false;
      status = 'LIVE';
      mascotState = 'idle';
      detectLoop();
    } catch (error) {
      console.error(error);
      isLoading = false;
      isRunning = false;
      status = '[CAMERA BLOCKED]';
      mascotState = 'confused';
    }
  }

  function stopDemo() {
    stopRequested = true;
    isRunning = false;
    isLoading = false;
    detections = [];
    lockedOnce = false;
    status = 'LIVE';
    mascotState = 'idle';
    clearCanvas();

    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
    if (video) video.srcObject = null;
  }

  function detectLoop() {
    if (stopRequested || !isRunning || !detector || !video) return;

    detector.detect(video, (error, results) => {
      if (error) {
        console.error(error);
        status = '[DETECTION ERROR]';
        requestAnimationFrame(detectLoop);
        return;
      }

      detections = Array.isArray(results) ? results : [];
      drawDetections();

      if (detections.length > 0) {
        mascotState = 'locked';
        if (!lockedOnce) {
          lockedOnce = true;
          gsap.fromTo(
            panel,
            { scale: 0.96 },
            { scale: 1, duration: 0.55, ease: 'back.out(3.2)' }
          );
        }
      } else {
        mascotState = 'idle';
        lockedOnce = false;
      }

      setTimeout(detectLoop, 90);
    });
  }

  function normalizeDetection(detection) {
    return {
      x: detection.x ?? detection.bbox?.[0] ?? detection.boundingBox?.originX ?? 0,
      y: detection.y ?? detection.bbox?.[1] ?? detection.boundingBox?.originY ?? 0,
      width: detection.width ?? detection.bbox?.[2] ?? detection.boundingBox?.width ?? 0,
      height: detection.height ?? detection.bbox?.[3] ?? detection.boundingBox?.height ?? 0,
      label: detection.label ?? detection.class ?? detection.className ?? '[DETECTION LABEL]',
      score: detection.confidence ?? detection.score ?? detection.probability ?? 0
    };
  }

  function setupCanvas() {
    const rect = canvas?.getBoundingClientRect();
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
    const setup = setupCanvas();
    if (!setup) return;
  }

  function drawDetections() {
    const setup = setupCanvas();
    if (!setup || !video?.videoWidth || !video?.videoHeight) return;

    const { ctx, width, height, rc } = setup;
    const scale = Math.max(width / video.videoWidth, height / video.videoHeight);
    const drawnWidth = video.videoWidth * scale;
    const drawnHeight = video.videoHeight * scale;
    const offsetX = (width - drawnWidth) / 2;
    const offsetY = (height - drawnHeight) / 2;

    detections.map(normalizeDetection).forEach((detection, index) => {
      const color = brandColors[index % brandColors.length];
      const x = offsetX + detection.x * scale;
      const y = offsetY + detection.y * scale;
      const boxWidth = detection.width * scale;
      const boxHeight = detection.height * scale;
      const label = detection.score
        ? `${detection.label} ${Math.round(detection.score * 100)}%`
        : detection.label;

      rc.rectangle(x, y, boxWidth, boxHeight, {
        stroke: color,
        strokeWidth: 3.5,
        roughness: 2.6,
        bowing: 1.6,
        seed: index + 70
      });

      ctx.font = '700 14px Space Grotesk';
      const labelWidth = ctx.measureText(label).width + 18;
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
      ctx.fillText(label, x + 9, labelY + 18);
    });
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

    <div class="worked-demo" bind:this={panel}>
      <RoughFrame stroke="#f1c40f" fill="#fdfbf5" seed={54} radius={28} roughness={2.1}>
        <div class="camera-wrap">
          {#if stream}
            <video bind:this={video} muted playsinline></video>
          {/if}
          <canvas bind:this={canvas} class="detection-layer" aria-hidden="true"></canvas>
          {#if !stream}
            <div class="camera-empty">[WEBCAM PLACEHOLDER]</div>
          {/if}
        </div>
      </RoughFrame>
      <p class="scribble caption-note">[EXAMPLE CAPTION]</p>
    </div>
  </div>
</section>
