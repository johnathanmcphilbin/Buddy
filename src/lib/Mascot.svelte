<script>
  export let state = 'idle';
  export let size = 176;
  export let caption = '';
</script>

<figure class="mascot" style={`--mascot-size:${size}px`}>
  <div class="mascot-stage">
    <img class="mascot-image" src="/images/buddy-excited.png" alt="Buddy" width={size} height={size} />
  </div>
  {#if caption}
    <figcaption>{caption}</figcaption>
  {/if}
</figure>
