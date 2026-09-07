<script>
  import { spring } from 'svelte/motion';
  import { LottiePlayer } from '@lottiefiles/svelte-lottie-player';

  export let state = 'idle';
  export let size = 176;
  export let caption = '';

  const eyeScale = spring(1, {
    stiffness: 0.12,
    damping: 0.36
  });

  $: src = `/lottie/mascot-${state}.json`;
  $: eyeScale.set(state === 'locked' ? 1.42 : state === 'confused' ? 1.22 : 1);
</script>

<figure class="mascot" style={`--mascot-size:${size}px`}>
  <div class="mascot-stage">
    <LottiePlayer
      {src}
      autoplay={true}
      loop={true}
      controls={false}
      renderer="svg"
      background="transparent"
      width={size}
      height={size}
    />
    <span class="eye-motion" style={`transform: translate(-50%, -50%) scale(${$eyeScale})`}></span>
  </div>
  {#if caption}
    <figcaption>{caption}</figcaption>
  {/if}
</figure>
