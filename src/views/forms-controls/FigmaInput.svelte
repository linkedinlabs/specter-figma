<script>
  import { createEventDispatcher, onMount } from 'svelte';

  export let autoSelect = false;
  export let className = null;
  export let disabled = null;
  export let focused = false;
  export let nameId = null;
  export let placeholder = null;
  export let inputType = 'text';
  export let value = null;
  export let watchBlur = false;

  let inputElement = null;
  const dispatch = createEventDispatcher();

  onMount(() => {
    if (focused) {
      inputElement.focus();
    }
  });

  const selectAll = () => {
    if (autoSelect) {
      setTimeout(() => {
        inputElement.select();
      }, 5);
    }
  };

  // set input type (svelte does not directly support a bound value _with_ type as a prop)
  const setType = (node) => {
    node.type = inputType; // eslint-disable-line no-param-reassign
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
    on:blur={watchBlur ? () => dispatch('saveSignal') : undefined}
    disabled={disabled}
    id={nameId}
    on:focus={selectAll}
    on:keyup={watchKeys}
    name={nameId}
    placeholder={placeholder}
    use:setType
    bind:this={inputElement}
    bind:value={value}
  >
</span>
