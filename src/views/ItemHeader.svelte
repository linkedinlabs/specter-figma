<script>
  import { createEventDispatcher } from 'svelte';

  import ButtonOpenClose from './forms-controls/ButtonOpenClose';

  export let isOpen = false;
  export let labelText = 'Item name here';
  export let type = null;

  const dispatch = createEventDispatcher();

</script>

<style>
  /* components/list-headers */
</style>

<header class:isOpen class={`item-header ${type}`}>
  <span class="left">
    <span class="actions">
      <ButtonOpenClose
        on:handleUpdate={() => dispatch('handleUpdate', 'toggleOpen')}
        isOpen={isOpen}
      />
    </span>
    <span class="text">
      {labelText}
    </span>
  </span>
  <span class="right">
    <em>—</em>
  </span>
</header>
