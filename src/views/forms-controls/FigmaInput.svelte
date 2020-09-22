<script>
  import { createEventDispatcher } from 'svelte';

  export let className = null;
  export let disabled = null;
  export let nameId = null;
  export let placeholder = null;
  export let value = null;

  const dispatch = createEventDispatcher();

  const watchKeys = (event) => {
    const { key } = event;

    if (key === 'Enter') {
      dispatch('saveSignal');
    }

    return null;
  };
</script>

<style>
  /* components/figma-input */
</style>

<span class={className}>
  <input
    disabled={disabled}
    id={nameId}
    on:keyup={watchKeys}
    name={nameId}
    placeholder={placeholder}
    type="text"
    bind:value={value}
  >
</span>
