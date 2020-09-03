<script>
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();
</script>

<button
  on:click={() => dispatch('handleAction', 'info')}
  class="info-trigger"
>
  <span class="icon"></span>
  <span class="text">Specter Info</span>
</button>
