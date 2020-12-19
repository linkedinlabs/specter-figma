<script>
  import { afterUpdate, beforeUpdate } from 'svelte';
  import { updateArray } from '../Tools';

  import FormUnit from './forms-controls/FormUnit';

  export let isSelected = false;
  export let itemId = null;
  export let keys = null;
  export let type = null;

  let newKeyValue = 'no-role';
  let dirtyKeys = keys ? [...keys] : [];
  let originalKeys = keys ? [...keys] : [];
  let resetValue = false;

  const controlRoles = [
    {
      value: 'no-role',
      text: 'Undefined…',
      disabled: true,
    },
    {
      value: 'divider--01',
      text: null,
      disabled: true,
    },
    {
      value: 'image',
      text: 'Image',
      disabled: false,
    },
    {
      value: 'image-decorative',
      text: 'Image (decorative)',
      disabled: false,
    },
    {
      value: 'divider--01',
      text: null,
      disabled: true,
    },
    {
      value: 'button',
      text: 'Button',
      disabled: false,
    },
    {
      value: 'checkbox',
      text: 'Checkbox',
      disabled: false,
    },
    {
      value: 'link',
      text: 'Link',
      disabled: false,
    },
    {
      value: 'option',
      text: 'Option',
      disabled: false,
    },
  ];

  const updateRole = (currentKeys, keyToUpdate, oldKeyIndex) => {
    const oldKey = currentKeys[oldKeyIndex];
    if (oldKey !== keyToUpdate) {
      removeKey(oldKey);

      if (keyToUpdate !== 'no-role') {
        addKey(keyToUpdate);
      }
    }
  };

  /**
   * @description Takes two one-dimensional arrays and compare them. Returns `true` if they
   * are different. Order of the array does not matter.
   *
   * @kind function
   * @name compareArrays
   *
   * @param {Array} array1 A single-dimension array.
   * @param {Array} array2 A single-dimension array to compare against.
   *
   * @returns {boolean} Returns `true` if the arrays are different, `false` if they have identical
   * values.
   */
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
    <li class="keys-item">
      <span class="form-element-holder">
        <FormUnit
          className="form-row"
          hideLabel={true}
          kind="inputSelect"
          labelText="Key"
          nameId={`${itemId}-role`}
          options={controlRoles}
          resetValue={resetValue}
          selectWatchChange={true}
          on:saveSignal={() => updateRole(originalKeys, dirtyKey, i)}
          bind:value={dirtyKey}
        />
      </span>
    </li>
  </ul>
</article>
