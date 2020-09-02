<script>
  import { createEventDispatcher } from 'svelte';

  export let text = "Button";
  export let action = 'clicked';

  const dispatch = createEventDispatcher();
</script>

<button on:click={() => dispatch('handleAction', action)}>
  <span class="icon">
    <slot></slot>
  </span>
  <span class="text">
    {text}
  </span>
</button>
