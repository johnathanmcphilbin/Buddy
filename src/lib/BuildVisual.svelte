<script>
  import { onMount, onDestroy } from 'svelte';
  import rough from 'roughjs/bundled/rough.esm.js';

  export let kind = 'photos';
  export let accent = '#ec3750';

  let wrap;
  let canvas;
  let resizeObserver;

  const boxes = [
    { label: 'KEYS', x: 0.06, y: 0.52, w: 0.24, h: 0.32 },
    { label: 'PHONE', x: 0.4, y: 0.14, w: 0.22, h: 0.58 },
    { label: 'WALLET', x: 0.7, y: 0.36, w: 0.26, h: 0.42 }
  ];

  function drawPhotos(rc, w, h) {
    const size = Math.min(w * 0.34, h * 0.6);
    const spots = [
      { x: w * 0.06, y: h * 0.32, rot: -1 },
      { x: w * 0.32, y: h * 0.16, rot: 1 },
      { x: w * 0.58, y: h * 0.28, rot: -1 }
    ];

    spots.forEach((spot, i) => {
      rc.rectangle(spot.x, spot.y, size, size, {
        stroke: '#26324d',
        strokeWidth: 2,
        roughness: 1.7,
        bowing: 1.1,
        fill: '#ffffff',
        fillStyle: 'solid',
        seed: 30 + i
      });
    });

    const [keySpot, phoneSpot, walletSpot] = spots;

    const kx = keySpot.x + size * 0.32;
    const ky = keySpot.y + size * 0.42;
    rc.circle(kx, ky, size * 0.26, { stroke: accent, strokeWidth: 2, roughness: 1.6, seed: 61 });
    rc.line(kx + size * 0.13, ky, kx + size * 0.62, ky, { stroke: accent, strokeWidth: 2, roughness: 1.6, seed: 62 });
    rc.line(kx + size * 0.5, ky, kx + size * 0.5, ky + size * 0.16, { stroke: accent, strokeWidth: 2, roughness: 1.6, seed: 63 });
    rc.line(kx + size * 0.62, ky, kx + size * 0.62, ky + size * 0.2, { stroke: accent, strokeWidth: 2, roughness: 1.6, seed: 64 });

    const px = phoneSpot.x + size * 0.5;
    const py = phoneSpot.y + size * 0.5;
    rc.rectangle(px - size * 0.18, py - size * 0.32, size * 0.36, size * 0.64, {
      stroke: accent,
      strokeWidth: 2,
      roughness: 1.6,
      seed: 65
    });
    rc.line(px - size * 0.08, py + size * 0.24, px + size * 0.08, py + size * 0.24, {
      stroke: accent,
      strokeWidth: 2,
      roughness: 1.6,
      seed: 66
    });

    const wx = walletSpot.x + size * 0.5;
    const wy = walletSpot.y + size * 0.5;
    rc.rectangle(wx - size * 0.28, wy - size * 0.2, size * 0.56, size * 0.4, {
      stroke: accent,
      strokeWidth: 2,
      roughness: 1.6,
      seed: 67
    });
    rc.line(wx - size * 0.28, wy, wx + size * 0.28, wy, { stroke: accent, strokeWidth: 2, roughness: 1.6, seed: 68 });
  }

  function drawBoxes(rc, w, h) {
    rc.rectangle(w * 0.02, h * 0.06, w * 0.96, h * 0.88, {
      stroke: '#26324d',
      strokeWidth: 2,
      roughness: 1.5,
      bowing: 1,
      seed: 70
    });

    boxes.forEach((box, i) => {
      rc.rectangle(w * box.x, h * box.y, w * box.w, h * box.h, {
        stroke: accent,
        strokeWidth: 2,
        roughness: 1.8,
        bowing: 1.3,
        seed: 80 + i
      });
    });
  }

  function drawLogic(rc, w, h) {
    rc.rectangle(w * 0.04, h * 0.08, w * 0.92, h * 0.84, {
      stroke: '#26324d',
      strokeWidth: 2,
      roughness: 1.6,
      bowing: 1.2,
      fill: '#fffdf6',
      fillStyle: 'solid',
      seed: 90
    });
  }

  function drawSpeech(rc, w, h) {
    rc.rectangle(w * 0.04, h * 0.06, w * 0.92, h * 0.7, {
      stroke: '#26324d',
      strokeWidth: 2,
      roughness: 1.6,
      bowing: 1.2,
      fill: '#ffffff',
      fillStyle: 'solid',
      seed: 95
    });

    rc.line(w * 0.14, h * 0.76, w * 0.1, h * 0.94, { stroke: '#26324d', strokeWidth: 2, roughness: 1.6, seed: 96 });
    rc.line(w * 0.1, h * 0.94, w * 0.26, h * 0.78, { stroke: '#26324d', strokeWidth: 2, roughness: 1.6, seed: 97 });
  }

  function draw() {
    const rect = wrap?.getBoundingClientRect();
    if (!rect || !canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const rc = rough.canvas(canvas);
    const { width, height } = rect;

    if (kind === 'photos') drawPhotos(rc, width, height);
    if (kind === 'boxes') drawBoxes(rc, width, height);
    if (kind === 'logic') drawLogic(rc, width, height);
    if (kind === 'speech') drawSpeech(rc, width, height);
  }

  onMount(() => {
    resizeObserver = new ResizeObserver(draw);
    resizeObserver.observe(wrap);
    requestAnimationFrame(draw);
  });

  onDestroy(() => {
    resizeObserver?.disconnect();
  });
</script>

<div class="build-visual" bind:this={wrap}>
  <canvas bind:this={canvas} aria-hidden="true"></canvas>
</div>
