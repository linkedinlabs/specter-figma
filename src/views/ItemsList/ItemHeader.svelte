<script>
  import {
    afterUpdate,
    beforeUpdate,
    createEventDispatcher,
  } from 'svelte';
  import { getStopTypeFromView } from '../../utils/tools';
  import ButtonOpenClose from '../forms-controls/ButtonOpenClose';
  import FormUnit from '../forms-controls/FormUnit';

  export let isOpen = false;
  export let ariaNamed = false;
  export let isSelected = false;
  export let itemId = null;
  export let labelText = 'Item name here';
  export let position = null;
  export let type = null;
  export let showErrorIcon = false;

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

  const removeStopAnnotation = () => {
    parent.postMessage({
      pluginMessage: {
        action: 'a11y-remove-stop',
        payload: {
          id: itemId,
          type: getStopTypeFromView(type),
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

    if (['a11y-labels', 'a11y-headings', 'a11y-misc'].includes(currentItemType)) {
      options.className = 'form-row alpha-position';
      options.inputType = 'text';
      options.placeholder = 'a';
    }

    return options;
  };

  const updatePosition = (newPosition) => {
    // only update if the positions are different
    let sendPositionUpdate = false;
    if (type === 'keystop') {
      if (parseInt(originalPosition, 10) !== parseInt(newPosition, 10)) {
        sendPositionUpdate = true;
      }
    } else if (originalPosition !== newPosition) {
      sendPositionUpdate = true;
    }

    if (sendPositionUpdate) {
      parent.postMessage({
        pluginMessage: {
          action: 'a11y-update-stop',
          payload: {
            id: itemId,
            position: newPosition,
            type: getStopTypeFromView(type),
          },
        },
      }, '*');

      // pre-emptively reset to allow parent props to set new values
      handleReset();
    }
  };

  beforeUpdate(() => {
    // check `position` against original to see if it was updated on the Figma side
    if (type === 'keystop') {
      if (parseInt(originalPosition, 10) !== parseInt(position, 10)) {
        resetValue = true;
      }
    } else if (originalPosition !== position) {
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
  .text {
    margin: 0;
    white-space: nowrap;
    min-width: 0;
    max-width: 250px;
  }
  .text.ariaNamed {
    font-style: italic;
  }
  .truncated-text {
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>

<header class:isOpen class:isSelected class={`item-header ${type}`}>
  <span class="left">
    <span class="actions">
      <ButtonOpenClose
        on:handleUpdate={() => dispatch('handleUpdate', 'toggleOpen')}
        isOpen={isOpen}
      />
    </span>
    <span class="text" class:isOpen class:ariaNamed>
      {#if showErrorIcon}
        <span class="error-flag">&#9873;&nbsp;</span>
      {/if}
      <div class="truncated-text">{labelText}</div>
    </span>
  </span>
  <span class="right form-element-holder">
    <FormUnit
      className={setInputOptions(type).className}
      on:deleteSignal={() => removeStopAnnotation()}
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
