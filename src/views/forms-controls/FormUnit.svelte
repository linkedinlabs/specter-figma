<script>
  import { afterUpdate, createEventDispatcher } from 'svelte';
  import ButtonRemove from './ButtonRemove';
  import FigmaInput from './FigmaInput';
  import FigmaSelectMenu from './FigmaSelectMenu';
  import FormLabel from './FormLabel';

  export let className = null;
  export let hideLabel = false;
  export let isDeletable = false;
  export let isDirty = false;
  export let isDisabled = false;
  export let kind = 'inputText';
  export let labelText = 'Type something…';
  export let placeholder = null;
  export let nameId = 'text-input-id';
  export let resetValue = false;
  export let value = null;
  export let options = [];

  const dispatch = createEventDispatcher();
  let originalValue = value;

  const restoreValue = () => {
    value = originalValue;
  };

  const handleDelete = () => dispatch('deleteSignal');

  afterUpdate(() => {
    if (value !== originalValue) {
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
      isDirty={isDirty}
      isDisabled={isDisabled}
      nameId={nameId}
      value={value}
    />
  {/if}

  <span class="form-inner-row">
    {#if kind === 'inputSelect'}
      <FigmaSelectMenu
        className="form-element element-type-select split-50"
        disabled={isDisabled}
        nameId={nameId}
        options={options}
        bind:value={value}
      />
    {/if}

    {#if kind === 'inputText'}
      <FigmaInput
        className="form-element element-type-text"
        disabled={isDisabled}
        nameId={nameId}
        placeholder={placeholder}
        on:saveSignal
        bind:value={value}
      />
    {/if}

    {#if isDeletable}
      <ButtonRemove
        disabled={isDisabled}
        on:handleUpdate={() => handleDelete()}
      />
    {/if}
  </span>
</span>
