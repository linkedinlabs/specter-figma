<script>
  import { afterUpdate, createEventDispatcher } from 'svelte';
  import ButtonRemove from './ButtonRemove';
  import FigmaInput from './FigmaInput';
  import FormLabel from './FormLabel';

  export let className = null;
  export let hideLabel = false;
  export let invertView = false;
  export let isDeletable = false;
  export let isDirty = false;
  export let itemIsLocked = false;
  export let kind = 'inputText';
  export let labelText = 'Type something…';
  export let placeholder = null;
  export let nameId = 'text-input-id';
  export let resetValue = false;
  export let value = null;
  export let options = [];

  const dispatch = createEventDispatcher();
  let originalValue = value;
  let isLocked = itemIsLocked;
  let wasUnlocked = false;

  const restoreValue = () => {
    value = originalValue;
  };

  const handleDelete = () => dispatch('deleteSignal');

  afterUpdate(() => {
    // watch locking changes and restore value if item becomes locked
    if (!wasUnlocked && isLocked) {
      restoreValue();
      dispatch('lockUnlockSignal', isLocked);
    }

    if (wasUnlocked && !isLocked) {
      dispatch('lockUnlockSignal', isLocked);
    }

    // update the comparison variable
    wasUnlocked = isLocked;

    if ((value !== originalValue) && (value !== 'blank--multiple')) {
      isDirty = true;
    } else {
      isDirty = false;
    }

    // reset based on higher-level update
    if (resetValue) {
      originalValue = value;
      isDirty = false;
    }
  });
</script>

<span class={className}>
  {#if hideLabel}
    <FormLabel
      on:handleRestore={() => restoreValue()}
      labelText={labelText}
      invertView={invertView}
      isDirty={isDirty}
      bind:isLocked={isLocked}
      nameId={nameId}
      parentIsLocked={itemIsLocked}
      value={value}
    />
  {/if}

  <span class="form-inner-row">
    {#if kind === 'inputText'}
      <FigmaInput
        className="form-element element-type-text"
        disabled={isLocked || itemIsLocked}
        invertView={invertView}
        nameId={nameId}
        placeholder={placeholder}
        on:saveSignal
        bind:value={value}
      />
    {/if}

    {#if isDeletable}
      <ButtonRemove
        disabled={isLocked || itemIsLocked}
        on:handleUpdate={() => handleDelete()}
        invertView={invertView}
      />
    {/if}
  </span>
</span>
