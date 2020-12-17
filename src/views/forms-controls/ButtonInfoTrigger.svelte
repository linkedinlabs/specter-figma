<script>
  import { createEventDispatcher } from 'svelte';

  export let isInfoPanel = false;

  const dispatch = createEventDispatcher();

  const handleClick = (infoIsOpen) => {
    const dispatchAction = infoIsOpen ? 'info-hide' : 'info';
    dispatch('handleAction', dispatchAction);
  };
</script>

<button
  on:click={() => handleClick(isInfoPanel)}
  class={`info-trigger${isInfoPanel ? ' info-open' : ''}`}
>
  <span class="icon"></span>
  <span class="text">Specter Info { isInfoPanel }</span>
</button>
