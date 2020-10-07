<script>
  import { createEventDispatcher } from 'svelte';

  export let autoSelect = false;
  export let className = null;
  export let disabled = null;
  export let nameId = null;
  export let placeholder = null;
  export let value = null;

  let inputElement = null;
  const dispatch = createEventDispatcher();

  const selectAll = () => {
    if (autoSelect) {
      inputElement.select();
    }
  };

  const watchKeys = (event) => {
    const { key } = event;

    if (key === 'Enter') {
      dispatch('saveSignal');
      selectAll();
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
    on:focus={selectAll}
    on:keyup={watchKeys}
    name={nameId}
    placeholder={placeholder}
    bind:this={inputElement}
    type="text"
    bind:value={value}
  >
</span>
