<script>
  import { onMount, onDestroy } from 'svelte';
  import rough from 'roughjs/bundled/rough.esm.js';

  export let colors = ['#ec3750', '#ff8c37', '#f1c40f', '#33d6a6', '#338eda', '#a633d6'];
  export let height = 56;

  let canvas;
  let wrap;
  let resizeObserver;

  function draw() {
    const rect = wrap?.getBoundingClientRect();
    if (!rect || !canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, height);

    const rc = rough.canvas(canvas);
    const gap = height / (colors.length + 1);
    colors.forEach((color, index) => {
      const y = gap * (index + 1);
      rc.curve(
        [
          [0, y + Math.sin(index) * 4],
          [rect.width * 0.25, y - 8 + index],
          [rect.width * 0.5, y + 9 - index],
          [rect.width * 0.75, y - 5],
          [rect.width, y + Math.cos(index) * 4]
        ],
        {
          stroke: color,
          strokeWidth: 4,
          roughness: 2.2,
          bowing: 1.4,
          seed: index + 4
        }
      );
    });
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

<div class="rough-divider" style={`height:${height}px`} bind:this={wrap}>
  <canvas bind:this={canvas} aria-hidden="true"></canvas>
</div>
