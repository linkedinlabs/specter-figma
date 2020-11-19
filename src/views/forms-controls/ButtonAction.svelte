<script>
  import { createEventDispatcher } from 'svelte';

  export let action = 'clicked';
  export let className = null;
  export let disabled = false;
  export let isReversed = false;
  export let text = 'Button';

  const dispatch = createEventDispatcher();
</script>

<style>
  /* components/icon-button-action > @icon-button-action */
</style>

<button
  on:click={() => dispatch('handleAction', action)}
  class={className}
  disabled={disabled}
>
  {#if !isReversed}
    <span class="icon">
      <slot><!-- icon svg code here --></slot>
    </span>
  {/if}
  <span class="text">
    {text}
  </span>
  {#if isReversed}
    <span class="icon">
      <slot><!-- icon svg code here --></slot>
    </span>
  {/if}
</button>
