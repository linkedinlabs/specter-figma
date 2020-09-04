<script>
  import { createEventDispatcher } from 'svelte';

  export let text = 'Button';
  export let action = 'clicked';

  const dispatch = createEventDispatcher();
</script>

<button on:click={() => dispatch('handleAction', action)}>
  <span class="icon">
    <slot><!-- icon svg code here --></slot>
  </span>
  <span class="text">
    {text}
  </span>
</button>
