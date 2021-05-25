<script>
  import { createEventDispatcher } from 'svelte';

  export let disabled = false;
  export let labelText = null;
  export let nameId = null;
  export let value = false;

  const dispatch = createEventDispatcher();
</script>

<style>
  /* components/figma-switch */
</style>

<span class="switch" on:click={() => dispatch('saveSignal')}>
  <input
    checked={value}
    class="switch__toggle"
    disabled={disabled}
    id={nameId}
    name={nameId}
    type="checkbox"
  >
  <label
    class="switch__label"
    for={nameId}
  >
  {#if labelText}
    <span class="label-text">{labelText}</span>
  {/if} 
  </label>
</span>
