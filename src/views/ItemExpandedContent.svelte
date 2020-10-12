<script>
  import FormUnit from './forms-controls/FormUnit';

  export let isSelected = false;
  export let itemId = null;
  export let labelText = 'Item name here';
  export let position = null;
  export let type = null;

  let newKeyValue = 'no-key';

  const keyboardOptionsInit = [
    {
      value: 'no-key',
      text: 'Add key…',
      disabled: true,
    },
    {
      value: 'divider--01',
      text: null,
      disabled: true,
    },
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
    {
      value: 'divider--02',
      text: null,
      disabled: true,
    },
    {
      value: 'space',
      text: 'Space',
      disabled: false,
    },
    {
      value: 'divider--03',
      text: null,
      disabled: true,
    },
    {
      value: 'escape',
      text: 'Escape',
      disabled: false,
    },
  ];

  const keyboardOptions = [
    {
      value: 'remove',
      text: 'No key (remove)',
      disabled: false,
    },
    {
      value: 'divider--01',
      text: null,
      disabled: true,
    },
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
    {
      value: 'divider--02',
      text: null,
      disabled: true,
    },
    {
      value: 'space',
      text: 'Space',
      disabled: false,
    },
    {
      value: 'divider--03',
      text: null,
      disabled: true,
    },
    {
      value: 'escape',
      text: 'Escape',
      disabled: false,
    },
  ];

  const addKey = (keyToAdd) => {
    if (keyToAdd !== 'no-key') {
      parent.postMessage({
        pluginMessage: {
          action: `${type}-set-key`,
          payload: {
            id: itemId,
            key: keyToAdd,
          },
        },
      }, '*');
    }
  };

  const removeKey = (keyToRemove) => {
    parent.postMessage({
      pluginMessage: {
        action: `${type}-remove-key`,
        payload: {
          id: itemId,
          key: keyToRemove,
        },
      },
    }, '*');
  };
</script>

<style>
  /* components/list-item-content */
</style>

<article class:isSelected class="item-content">
  <ul class="keys-list">
    <li class="keys-item">
      <span class="form-element-holder">
        <FormUnit
          className="form-row"
          on:deleteSignal={() => removeKey('test')}
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
    <li class="keys-item init">
      <span class="form-element-holder">
        <FormUnit
          className="form-row"
          kind="inputSelect"
          labelText="Key"
          nameId={`${itemId}-key-no-key`}
          options={keyboardOptionsInit}
          placeholder="0"
          resetValue={false}
          selectWatchChange={true}
          on:saveSignal={() => addKey(newKeyValue)}
          bind:value={newKeyValue}
        />
      </span>
    </li>
  </ul>
</article>
