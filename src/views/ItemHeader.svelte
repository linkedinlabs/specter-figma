<script>
  import {
    afterUpdate,
    beforeUpdate,
    createEventDispatcher,
  } from 'svelte';

  import ButtonOpenClose from './forms-controls/ButtonOpenClose';
  import FormUnit from './forms-controls/FormUnit';

  export let isOpen = false;
  export let isSelected = false;
  export let itemId = null;
  export let labelText = 'Item name here';
  export let position = null;
  export let type = null;

  let dirtyPosition = position;
  let originalPosition = position;
  let resetValue = false;
  let wasResetValue = false;

  const dispatch = createEventDispatcher();

  const handleReset = () => {
    originalPosition = position;
    dirtyPosition = position;
    resetValue = true;
  };

  const removeStop = () => {
    parent.postMessage({
      pluginMessage: {
        action: `${type}-remove-stop`,
        payload: {
          id: itemId,
        },
      },
    }, '*');
  };

  const setInputOptions = (currentItemType) => {
    const options = {
      className: 'form-row',
      inputType: 'number',
      placeholder: '0',
    };

    if (currentItemType === 'a11y-labels') {
      options.className = 'form-row alpha-position';
      options.inputType = 'text';
      options.placeholder = 'a';
    }

    return options;
  };

  const updatePosition = (newPosition) => {
    if (parseInt(originalPosition, 10) !== parseInt(newPosition, 10)) {
      parent.postMessage({
        pluginMessage: {
          action: `${type}-update-stop`,
          payload: {
            id: itemId,
            position: newPosition,
          },
        },
      }, '*');

      // pre-emptively reset to allow parent props to set new values
      handleReset();
    }
  };

  beforeUpdate(() => {
    // check `position` against original to see if it was updated on the Figma side
    if (parseInt(originalPosition, 10) !== parseInt(position, 10)) {
      resetValue = true;
    }

    // tee off a full reset
    if (resetValue) {
      handleReset();
    }

    // set trackers
    wasResetValue = resetValue;
  });

  afterUpdate(() => {
    if (resetValue || wasResetValue) {
      resetValue = false;
    }
  });
</script>

<style>
  /* components/list-headers */
</style>

<header class:isOpen class:isSelected class={`item-header ${type}`}>
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
      className={setInputOptions(type).className}
      on:deleteSignal={() => removeStop()}
      hideLabel={true}
      isDeletable={true}
      inputType={setInputOptions(type).inputType}
      inputWatchBlur={true}
      kind="inputText"
      labelText="Position"
      nameId={`item-position-${itemId}`}
      placeholder={setInputOptions(type).placeholder}
      resetValue={resetValue}
      on:saveSignal={() => updatePosition(dirtyPosition)}
      bind:value={dirtyPosition}
    />
  </span>
</header>
