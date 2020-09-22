<script>
  import { createEventDispatcher } from 'svelte';

  import FigmaSelectMenu from './forms-controls/FigmaSelectMenu';
  import FormUnit from './forms-controls/FormUnit';

  export let itemId = null;
  export let labelText = 'Item name here';
  export let position = null;
  export let type = null;

  const dispatch = createEventDispatcher();

  const keyboardOptionsInit = [
    {
      value: 'no-key',
      text: 'Add key…',
      disabled: true,
    },
    // --------
    {
      value: 'arrows-left-right',
      text: 'Arrow keys (left/right)',
      disabled: false,
    },
    {
      value: 'arrows-up-down',
      text: 'Arrow keys (up/down)',
      disabled: false,
    },
    {
      value: 'enter',
      text: 'Enter',
      disabled: false,
    },
    // --------
    {
      value: 'space',
      text: 'Space',
      disabled: false,
    },
    // --------
    {
      value: 'escape',
      text: 'Escape',
      disabled: false,
    },
  ]

  const keyboardOptions = [
    {
      value: 'remove',
      text: 'No key (remove)',
      disabled: false,
    },
    // --------
    {
      value: 'arrows-left-right',
      text: 'Arrow keys (left/right)',
      disabled: false,
    },
    {
      value: 'arrows-up-down',
      text: 'Arrow keys (up/down)',
      disabled: false,
    },
    {
      value: 'enter',
      text: 'Enter',
      disabled: false,
    },
    // --------
    {
      value: 'space',
      text: 'Space',
      disabled: false,
    },
    // --------
    {
      value: 'escape',
      text: 'Escape',
      disabled: false,
    },
  ]
</script>

<style>
  /* components/list-headers */
</style>

<article class="item-content">
  <ul>
    <li>
      <span class="form-element-holder">
        <FormUnit
          className="form-row"
          on:deleteSignal={() => dispatch('handleUpdate', 'removeKeyEntry', itemId)}
          isDeletable={true}
          kind="inputSelect"
          labelText="Key"
          nameId={`${itemId}-key-arrows-up-down`}
          options={keyboardOptions}
          placeholder="0"
          resetValue="arrows-up-down"
          value="arrows-up-down"
        />
      </span>
    </li>
    <li class="init">
      <FigmaSelectMenu options={keyboardOptionsInit} value="no-key" />
    </li>
  </ul>
</article>

<p>Item Expanded</p>
