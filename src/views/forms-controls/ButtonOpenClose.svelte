<script>
  import { createEventDispatcher } from 'svelte';

  export let isOpen = false;

  const dispatch = createEventDispatcher();
  const handleClick = () => {
    isOpen = !isOpen;
    dispatch('handleUpdate');
  };
</script>

<style>
  /* components/icon-button > @button-icon */
</style>

<button
  class={`item-toggle action-open-close${isOpen ? ' open' : ''}`}
  on:click={() => handleClick()}
>
  <span class="text">
    {`${isOpen ? 'Close' : 'Open'} item`}
  </span>
  <span class="icon">
    <svg viewBox="0 0 16 16">
      <path d="M8.5 12L14.5 4L2.5 4L8.5 12Z"/>
    </svg>
  </span>
</button>
