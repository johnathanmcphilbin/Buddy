<script>
  import { onMount, onDestroy } from 'svelte';
  import rough from 'roughjs/bundled/rough.esm.js';

  export let palette = ['#ec3750', '#338eda', '#33d6a6'];
  export let seed = 1;

  let canvas;
  let resizeObserver;

  function draw() {
    const rect = canvas?.getBoundingClientRect();
    if (!rect) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const rc = rough.canvas(canvas);
    rc.rectangle(8, 8, rect.width - 16, rect.height - 16, {
      stroke: '#26324d',
      strokeWidth: 2,
      roughness: 2,
      fill: '#fdfbf5',
      fillStyle: 'solid',
      seed
    });

    const baseY = rect.height * 0.66;
    rc.curve(
      [
        [16, baseY],
        [rect.width * 0.25, baseY - 20],
        [rect.width * 0.5, baseY + 18],
        [rect.width * 0.78, baseY - 15],
        [rect.width - 16, baseY + 4]
      ],
      { stroke: palette[2], strokeWidth: 5, roughness: 2.1, seed: seed + 1 }
    );

    rc.circle(rect.width * 0.26, rect.height * 0.36, 54, {
      stroke: palette[1],
      strokeWidth: 3,
      fill: '#edf7ff',
      fillStyle: 'hachure',
      roughness: 1.6,
      seed: seed + 2
    });
    rc.rectangle(rect.width * 0.54, rect.height * 0.28, rect.width * 0.25, rect.height * 0.24, {
      stroke: palette[0],
      strokeWidth: 3,
      fill: '#fff4df',
      fillStyle: 'zigzag',
      roughness: 1.7,
      seed: seed + 3
    });
    rc.rectangle(rect.width * 0.15, rect.height * 0.18, rect.width * 0.28, rect.height * 0.36, {
      stroke: palette[0],
      strokeWidth: 3,
      roughness: 2.4,
      bowing: 1.5,
      seed: seed + 4
    });
    rc.rectangle(rect.width * 0.49, rect.height * 0.22, rect.width * 0.35, rect.height * 0.38, {
      stroke: palette[1],
      strokeWidth: 3,
      roughness: 2.2,
      bowing: 1.4,
      seed: seed + 5
    });

    ctx.font = '700 13px Space Grotesk';
    ctx.fillStyle = '#26324d';
    ctx.fillText('[DEMO FRAME]', 18, rect.height - 20);
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

<canvas class="showcase-still" bind:this={canvas} aria-label="[SUBMITTED DEMO STILL]"></canvas>
