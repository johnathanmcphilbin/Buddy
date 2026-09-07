<script>
  import { onMount, onDestroy } from 'svelte';
  import rough from 'roughjs/bundled/rough.esm.js';

  export let type = 'camera';
  export let accent = '#ec3750';
  export let secondary = '#338eda';

  let canvas;
  let resizeObserver;

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

  function drawCamera(rc, w, h) {
    rc.rectangle(w * 0.18, h * 0.28, w * 0.64, h * 0.44, {
      stroke: '#26324d',
      strokeWidth: 3,
      roughness: 1.6,
      fill: '#ffffff',
      fillStyle: 'solid',
      seed: 8
    });
    rc.circle(w * 0.5, h * 0.5, w * 0.2, {
      stroke: secondary,
      strokeWidth: 4,
      fill: '#edf7ff',
      fillStyle: 'zigzag',
      roughness: 1.7,
      seed: 10
    });
    rc.rectangle(w * 0.27, h * 0.18, w * 0.2, h * 0.1, {
      stroke: accent,
      strokeWidth: 3,
      roughness: 1.9,
      fill: '#fff4df',
      seed: 11
    });
  }

  function drawModel(rc, w, h) {
    const points = [
      [w * 0.2, h * 0.34],
      [w * 0.48, h * 0.2],
      [w * 0.78, h * 0.36],
      [w * 0.66, h * 0.7],
      [w * 0.3, h * 0.72]
    ];
    rc.polygon(points, {
      stroke: '#26324d',
      strokeWidth: 3,
      roughness: 2,
      fill: '#f6f1ff',
      fillStyle: 'solid',
      seed: 14
    });
    points.forEach((point, index) => {
      rc.circle(point[0], point[1], 18, {
        stroke: colorsForIndex(index),
        strokeWidth: 3,
        fill: '#ffffff',
        fillStyle: 'solid',
        seed: index + 22
      });
    });
    rc.line(w * 0.2, h * 0.34, w * 0.66, h * 0.7, { stroke: secondary, strokeWidth: 2, roughness: 2 });
    rc.line(w * 0.48, h * 0.2, w * 0.3, h * 0.72, { stroke: accent, strokeWidth: 2, roughness: 2 });
  }

  function drawUpload(rc, w, h) {
    rc.rectangle(w * 0.22, h * 0.22, w * 0.56, h * 0.55, {
      stroke: '#26324d',
      strokeWidth: 3,
      roughness: 1.7,
      fill: '#fffdf6',
      fillStyle: 'solid',
      seed: 33
    });
    rc.line(w * 0.5, h * 0.62, w * 0.5, h * 0.34, { stroke: accent, strokeWidth: 6, roughness: 1.4, seed: 34 });
    rc.line(w * 0.37, h * 0.46, w * 0.5, h * 0.32, { stroke: accent, strokeWidth: 6, roughness: 1.4, seed: 35 });
    rc.line(w * 0.63, h * 0.46, w * 0.5, h * 0.32, { stroke: accent, strokeWidth: 6, roughness: 1.4, seed: 36 });
    rc.rectangle(w * 0.35, h * 0.68, w * 0.3, h * 0.04, { stroke: secondary, strokeWidth: 4, roughness: 1.8, seed: 37 });
  }

  function drawReward(rc, w, h) {
    rc.rectangle(w * 0.24, h * 0.34, w * 0.52, h * 0.36, {
      stroke: '#26324d',
      strokeWidth: 3,
      roughness: 1.9,
      fill: '#fff4df',
      fillStyle: 'solid',
      seed: 41
    });
    rc.rectangle(w * 0.2, h * 0.27, w * 0.6, h * 0.12, {
      stroke: accent,
      strokeWidth: 3,
      roughness: 2.1,
      fill: '#ffe9ef',
      fillStyle: 'solid',
      seed: 42
    });
    rc.line(w * 0.5, h * 0.28, w * 0.5, h * 0.7, { stroke: secondary, strokeWidth: 5, roughness: 1.5, seed: 43 });
    rc.arc(w * 0.43, h * 0.27, 36, 28, Math.PI * 0.88, Math.PI * 1.95, false, {
      stroke: '#33d6a6',
      strokeWidth: 4,
      roughness: 2,
      seed: 44
    });
    rc.arc(w * 0.57, h * 0.27, 36, 28, Math.PI * 1.05, Math.PI * 2.12, false, {
      stroke: '#a633d6',
      strokeWidth: 4,
      roughness: 2,
      seed: 45
    });
  }

  function colorsForIndex(index) {
    return ['#ec3750', '#ff8c37', '#f1c40f', '#33d6a6', '#338eda', '#a633d6'][index % 6];
  }

  function draw() {
    const setup = setupCanvas();
    if (!setup) return;

    const { rc, width, height } = setup;
    const dots = ['#ec3750', '#ff8c37', '#f1c40f', '#33d6a6', '#338eda', '#a633d6'];

    dots.forEach((color, index) => {
      rc.circle(20 + index * 26, height - 18 - (index % 2) * 8, 9, {
        stroke: color,
        strokeWidth: 2,
        fill: color,
        fillStyle: 'solid',
        roughness: 1.6,
        seed: index + 2
      });
    });

    if (type === 'model') drawModel(rc, width, height);
    else if (type === 'upload') drawUpload(rc, width, height);
    else if (type === 'reward') drawReward(rc, width, height);
    else drawCamera(rc, width, height);
  }

  onMount(() => {
    resizeObserver = new ResizeObserver(draw);
    resizeObserver.observe(canvas);
    requestAnimationFrame(draw);
  });

  onDestroy(() => {
    resizeObserver?.disconnect();
  });
</script>

<canvas class="step-graphic" bind:this={canvas} aria-hidden="true"></canvas>
