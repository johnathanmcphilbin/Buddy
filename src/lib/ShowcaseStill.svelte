<script>
  import { onMount, onDestroy } from 'svelte';
  import rough from 'roughjs/bundled/rough.esm.js';

  export let palette = ['#ec3750', '#338eda', '#33d6a6'];
  export let seed = 1;
  export let variant = 0;

  let canvas;
  let resizeObserver;

  function drawDoorway(rc, w, h) {
    rc.rectangle(w * 0.32, h * 0.14, w * 0.36, h * 0.72, {
      stroke: palette[0],
      strokeWidth: 3,
      roughness: 2.2,
      bowing: 1.4,
      seed: seed + 4
    });
    rc.line(w * 0.32, h * 0.86, w * 0.68, h * 0.86, {
      stroke: palette[0],
      strokeWidth: 3,
      roughness: 2.2,
      seed: seed + 5
    });
    rc.circle(w * 0.22, h * 0.4, 30, {
      stroke: palette[1],
      strokeWidth: 3,
      fill: '#edf7ff',
      fillStyle: 'hachure',
      roughness: 1.6,
      seed: seed + 2
    });
    rc.rectangle(w * 0.66, h * 0.3, w * 0.18, h * 0.26, {
      stroke: palette[2],
      strokeWidth: 3,
      fill: '#fff4df',
      fillStyle: 'zigzag',
      roughness: 1.7,
      seed: seed + 3
    });
  }

  function drawDesk(rc, w, h) {
    rc.line(w * 0.12, h * 0.68, w * 0.88, h * 0.68, {
      stroke: palette[0],
      strokeWidth: 4,
      roughness: 2,
      seed: seed + 1
    });
    rc.rectangle(w * 0.18, h * 0.34, w * 0.24, h * 0.34, {
      stroke: palette[1],
      strokeWidth: 3,
      roughness: 2.1,
      bowing: 1.3,
      seed: seed + 2
    });
    rc.rectangle(w * 0.48, h * 0.42, w * 0.18, h * 0.26, {
      stroke: palette[2],
      strokeWidth: 3,
      fill: '#fdf3e6',
      fillStyle: 'hachure',
      roughness: 1.8,
      seed: seed + 3
    });
    rc.circle(w * 0.76, h * 0.5, 24, {
      stroke: palette[0],
      strokeWidth: 3,
      roughness: 1.9,
      seed: seed + 4
    });
  }

  function drawHand(rc, w, h) {
    rc.circle(w * 0.5, h * 0.44, w * 0.32, {
      stroke: palette[1],
      strokeWidth: 3,
      roughness: 2.3,
      bowing: 1.6,
      seed: seed + 1
    });
    for (let i = 0; i < 3; i += 1) {
      const x = w * (0.36 + i * 0.14);
      rc.line(x, h * 0.44, x, h * 0.18, {
        stroke: palette[0],
        strokeWidth: 4,
        roughness: 2.4,
        seed: seed + i + 2
      });
    }
    rc.curve(
      [
        [w * 0.18, h * 0.8],
        [w * 0.4, h * 0.68],
        [w * 0.62, h * 0.78],
        [w * 0.84, h * 0.66]
      ],
      { stroke: palette[2], strokeWidth: 3, roughness: 2, seed: seed + 6 }
    );
  }

  function drawCards(rc, w, h) {
    const cardW = w * 0.22;
    const cardH = h * 0.5;
    [0, 1, 2].forEach((i) => {
      rc.rectangle(w * (0.16 + i * 0.24), h * 0.24 + (i % 2) * 10, cardW, cardH, {
        stroke: palette[i % palette.length],
        strokeWidth: 3,
        fill: '#ffffff',
        fillStyle: 'solid',
        roughness: 2,
        bowing: 1.3,
        seed: seed + i + 2
      });
    });
    rc.line(w * 0.14, h * 0.86, w * 0.86, h * 0.86, {
      stroke: palette[0],
      strokeWidth: 3,
      roughness: 1.8,
      seed: seed + 9
    });
  }

  function drawSnack(rc, w, h) {
    rc.circle(w * 0.36, h * 0.5, w * 0.24, {
      stroke: palette[0],
      strokeWidth: 3,
      fill: '#fff4df',
      fillStyle: 'zigzag',
      roughness: 2,
      seed: seed + 1
    });
    rc.circle(w * 0.68, h * 0.32, w * 0.14, {
      stroke: palette[1],
      strokeWidth: 3,
      roughness: 2.1,
      seed: seed + 2
    });
    rc.circle(w * 0.7, h * 0.62, w * 0.1, {
      stroke: palette[2],
      strokeWidth: 3,
      roughness: 2.1,
      seed: seed + 3
    });
  }

  function drawRoom(rc, w, h) {
    rc.rectangle(w * 0.1, h * 0.14, w * 0.8, h * 0.72, {
      stroke: palette[0],
      strokeWidth: 3,
      roughness: 1.9,
      bowing: 1.2,
      seed: seed + 1
    });
    rc.line(w * 0.1, h * 0.5, w * 0.9, h * 0.5, {
      stroke: palette[1],
      strokeWidth: 2,
      roughness: 1.8,
      seed: seed + 2
    });
    rc.rectangle(w * 0.2, h * 0.58, w * 0.2, h * 0.2, {
      stroke: palette[2],
      strokeWidth: 3,
      roughness: 2,
      seed: seed + 3
    });
    rc.circle(w * 0.7, h * 0.3, 22, {
      stroke: palette[2],
      strokeWidth: 3,
      roughness: 2,
      seed: seed + 4
    });
  }

  const variants = [drawDoorway, drawDesk, drawHand, drawCards, drawSnack, drawRoom];

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

    const drawVariant = variants[variant % variants.length];
    drawVariant(rc, rect.width, rect.height);
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

<canvas class="showcase-still" bind:this={canvas}></canvas>
