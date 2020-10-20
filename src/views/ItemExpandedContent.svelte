<script>
  import { afterUpdate, beforeUpdate } from 'svelte';
  import { updateArray } from '../Tools';

  import FormUnit from './forms-controls/FormUnit';

  export let isSelected = false;
  export let itemId = null;
  export let keys = null;
  export let type = null;


  let newKeyValue = 'no-key';
  let dirtyKeys = keys ? [...keys] : [];
  let originalKeys = keys ? [...keys] : [];
  let resetValue = false;

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
      value: 'no-key',
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
      newKeyValue = 'no-key';
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

  const updateKey = (currentKeys, keyToUpdate, oldKeyIndex) => {
    const oldKey = currentKeys[oldKeyIndex];
    if (oldKey !== keyToUpdate) {
      removeKey(oldKey);

      if (keyToUpdate !== 'no-key') {
        addKey(keyToUpdate);
      }
    }
  };

  const compareArrays = (array1, array2) => {
    let isDifferent = false;

    if (!array1 && !array2) {
      return isDifferent;
    }

    if (
      (!array1 && array2)
      || (!array2 && array1)
    ) {
      isDifferent = true;
      return isDifferent;
    }

    if (array1.length !== array2.length) {
      isDifferent = true;
      return isDifferent;
    }

    array1.forEach((value) => {
      const itemIndex = array2.findIndex(
        foundValue => (foundValue === value),
      );

      if (itemIndex < 0) {
        isDifferent = true;
      }
    });

    if (isDifferent) {
      return isDifferent;
    }

    array2.forEach((value) => {
      const itemIndex = array1.findIndex(
        foundValue => (foundValue === value),
      );

      if (itemIndex < 0) {
        isDifferent = true;
      }
    });

    return isDifferent;
  };

  const updateSelect = (options) => {
    const currentKeys = options.keys;
    const selectType = options.type;
    let selectedValue = null;

    let modifiedSelectOptions = [...keyboardOptionsInit];
    if (selectType !== 'init') {
      modifiedSelectOptions = [...keyboardOptions];
      selectedValue = options.value;
    }

    if (currentKeys) {
      // remove existing key entries
      currentKeys.forEach((keyEntry) => {
        const compareValue = { value: keyEntry };
        if ((selectType === 'init') || (keyEntry !== selectedValue)) {
          modifiedSelectOptions = updateArray(
            modifiedSelectOptions,
            compareValue,
            'value',
            'remove',
          );
        }
      });

      // remove double dividers
      let lastIsDivider = false;
      modifiedSelectOptions.forEach((optionsEntry) => {
        const isDivider = optionsEntry.value.includes('divider--');

        if (isDivider && !lastIsDivider) {
          lastIsDivider = true;
        } else if (isDivider && lastIsDivider) {
          modifiedSelectOptions = updateArray(
            modifiedSelectOptions,
            optionsEntry,
            'value',
            'remove',
          );
        } else {
          lastIsDivider = false;
        }
      });

      // remove divider if it is last
      const lastOptionIndex = modifiedSelectOptions.length - 1;
      const lastOption = modifiedSelectOptions[lastOptionIndex];
      if (lastOption.value.includes('divider--')) {
        modifiedSelectOptions = updateArray(
          modifiedSelectOptions,
          lastOption,
          'value',
          'remove',
        );
      }
    }
    return modifiedSelectOptions;
  };

  beforeUpdate(() => {
    // check `keys` against original to see if it was updated on the Figma side
    if (compareArrays(keys, originalKeys)) {
      dirtyKeys = keys ? [...keys] : [];
      originalKeys = keys ? [...keys] : [];
      resetValue = true;
    }
  });

  afterUpdate(() => {
    if (resetValue) {
      resetValue = false;
    }
  });
</script>

<style>
  /* components/list-item-content */
</style>

<article class:isSelected class="item-content">
  <ul class="keys-list">
    {#each dirtyKeys as dirtyKey, i (dirtyKey)}
      <li class="keys-item">
        <span class="form-element-holder">
          <FormUnit
            className="form-row"
            on:deleteSignal={() => removeKey(dirtyKey)}
            hideLabel={true}
            isDeletable={true}
            kind="inputSelect"
            labelText="Key"
            nameId={`${itemId}-key-${dirtyKey}`}
            options={updateSelect({ keys, type: 'selected', value: dirtyKey })}
            resetValue={resetValue}
            selectWatchChange={true}
            on:saveSignal={() => updateKey(originalKeys, dirtyKey, i)}
            bind:value={dirtyKey}
          />
        </span>
      </li>
    {/each}
    {#if updateSelect({ keys, type: 'init' }).length > 1}
      <li class="keys-item init">
        <span class="form-element-holder">
          <FormUnit
            className="form-row"
            hideLabel={true}
            kind="inputSelect"
            labelText="Key"
            nameId={`${itemId}-key-no-key`}
            options={updateSelect({ keys, type: 'init' })}
            resetValue={resetValue}
            selectWatchChange={true}
            on:saveSignal={() => addKey(newKeyValue)}
            bind:value={newKeyValue}
          />
        </span>
      </li>
    {/if}
  </ul>
</article>
