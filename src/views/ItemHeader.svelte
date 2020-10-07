<script>
  import { createEventDispatcher } from 'svelte';

  import ButtonOpenClose from './forms-controls/ButtonOpenClose';
  import FormUnit from './forms-controls/FormUnit';

  export let isOpen = false;
  export let itemId = null;
  export let labelText = 'Item name here';
  export let position = null;
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
  <span class="right form-element-holder">
    <FormUnit
      className="form-row"
      on:deleteSignal={() => dispatch('handleUpdate', 'removeItem', itemId)}
      isDeletable={true}
      inputType="number"
      kind="inputText"
      labelText="Position"
      nameId={`item-position-${itemId}`}
      placeholder="0"
      resetValue="1"
      value={position}
    />
  </span>
</header>
