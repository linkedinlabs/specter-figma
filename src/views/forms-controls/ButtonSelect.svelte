<script>
  import { createEventDispatcher } from 'svelte';

  export let disabled = false;

  const dispatch = createEventDispatcher();
  const handleClick = () => {
    dispatch('handleUpdate');
  };
</script>

<style>
  /* components/icon-button > @button-icon */
</style>

<button
  class="inline-button action-select"
  on:click={() => handleClick()}
  disabled={disabled}
>
  <span class="label">
    Select layer
  </span>
  <span class="icon">
    <svg viewBox="0 0 32 32">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M11 11H11.5H14V12H12V14H11V11.5V11ZM18 11H20.5H21V11.5V14H20V12H18V11ZM12 20V18H11V20.5V21H11.5H14V20H12ZM21 18V20.5V21H20.5H18V20H20V18H21Z"/>
    </svg>
  </span>
</button>
