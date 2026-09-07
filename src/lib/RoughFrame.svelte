<script>
  import { onMount, afterUpdate, onDestroy } from 'svelte';
  import rough from 'roughjs/bundled/rough.esm.js';

  export let variant = 'box';
  export let stroke = '#26324d';
  export let fill = 'transparent';
  export let fillStyle = 'solid';
  export let strokeWidth = 3;
  export let roughness = 1.7;
  export let bowing = 1.2;
  export let seed = 1;
  export let inset = 7;
  export let radius = 20;
  export let bracketLength = 34;

  let shell;
  let canvas;
  let resizeObserver;

  function setCanvasSize() {
    const rect = shell?.getBoundingClientRect();
    if (!rect || !canvas) return null;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    return { ctx, width: rect.width, height: rect.height };
  }

  function drawBracket(rc, x, y, xDir, yDir) {
    const len = bracketLength;
    const corner = inset;
    rc.line(x, y, x + xDir * len, y, {
      stroke,
      strokeWidth,
      roughness,
      bowing,
      seed: seed + x + y
    });
    rc.line(x, y, x, y + yDir * len, {
      stroke,
      strokeWidth,
      roughness,
      bowing,
      seed: seed + x + y + 11
    });
    rc.arc(x + xDir * corner, y + yDir * corner, corner * 2, corner * 2, Math.PI, Math.PI * 1.5, false, {
      stroke,
      strokeWidth: Math.max(1, strokeWidth - 1),
      roughness: roughness + 0.2,
      bowing,
      seed: seed + 23
    });
  }

  function draw() {
    const setup = setCanvasSize();
    if (!setup) return;

    const { width, height } = setup;
    const rc = rough.canvas(canvas);

    if (variant === 'brackets') {
      const left = inset;
      const right = width - inset;
      const top = inset;
      const bottom = height - inset;
      drawBracket(rc, left, top, 1, 1);
      drawBracket(rc, right, top, -1, 1);
      drawBracket(rc, left, bottom, 1, -1);
      drawBracket(rc, right, bottom, -1, -1);
      return;
    }

    rc.rectangle(inset, inset, width - inset * 2, height - inset * 2, {
      stroke,
      strokeWidth,
      roughness,
      bowing,
      seed,
      fill,
      fillStyle
    });

    if (radius > 0) {
      rc.arc(inset + radius, inset + radius, radius * 2, radius * 2, Math.PI, Math.PI * 1.5, false, {
        stroke,
        strokeWidth: Math.max(1, strokeWidth - 1),
        roughness,
        bowing,
        seed: seed + 3
      });
      rc.arc(width - inset - radius, inset + radius, radius * 2, radius * 2, Math.PI * 1.5, Math.PI * 2, false, {
        stroke,
        strokeWidth: Math.max(1, strokeWidth - 1),
        roughness,
        bowing,
        seed: seed + 5
      });
      rc.arc(inset + radius, height - inset - radius, radius * 2, radius * 2, Math.PI * 0.5, Math.PI, false, {
        stroke,
        strokeWidth: Math.max(1, strokeWidth - 1),
        roughness,
        bowing,
        seed: seed + 7
      });
      rc.arc(width - inset - radius, height - inset - radius, radius * 2, radius * 2, 0, Math.PI * 0.5, false, {
        stroke,
        strokeWidth: Math.max(1, strokeWidth - 1),
        roughness,
        bowing,
        seed: seed + 9
      });
    }
  }

  onMount(() => {
    resizeObserver = new ResizeObserver(draw);
    resizeObserver.observe(shell);
    requestAnimationFrame(draw);
  });

  afterUpdate(() => {
    requestAnimationFrame(draw);
  });

  onDestroy(() => {
    resizeObserver?.disconnect();
  });
</script>

<div class="rough-frame" bind:this={shell} style={`--frame-color:${stroke}`}>
  <canvas bind:this={canvas} aria-hidden="true"></canvas>
  <div class="rough-frame-content">
    <slot />
  </div>
</div>
