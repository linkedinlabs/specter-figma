<script>
  import { afterUpdate, createEventDispatcher } from 'svelte';

  import ButtonRemove from './ButtonRemove';
  import FigmaInput from './FigmaInput';
  import FigmaSelectMenu from './FigmaSelectMenu';
  import FormLabel from './FormLabel';
  import FigmaSwitch from './FigmaSwitch';

  export let className = null;
  export let hideLabel = false;
  export let isDeletable = false;
  export let isDirty = false;
  export let isDisabled = false;
  export let inputType = 'text';
  export let inputWatchBlur = false;
  export let kind = 'inputText';
  export let labelText;
  export let placeholder = null;
  export let nameId = 'text-input-id';
  export let resetValue = false;
  export let selectWatchChange = false;
  export let value = null;
  export let options = [];
  export let focused = false;

  const dispatch = createEventDispatcher();
  let originalValue = value;

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
  <FormLabel
    hide={hideLabel}
    labelText={labelText}
    isDirty={isDirty}
    nameId={nameId}
  />
  <span class="form-inner-row">
    {#if kind === 'inputSelect'}
      <FigmaSelectMenu
        className="form-element element-type-select split-50"
        disabled={isDisabled}
        nameId={nameId}
        options={options}
        on:saveSignal
        bind:value={value}
        watchChange={selectWatchChange}
      />
    {/if}

    {#if kind === 'inputText'}
      <FigmaInput
        autoSelect={true}
        className="form-element element-type-text"
        disabled={isDisabled}
        focused={focused}
        inputType={inputType}
        nameId={nameId}
        placeholder={placeholder}
        on:saveSignal
        bind:value={value}
        watchBlur={inputWatchBlur}
      />
    {/if}

    {#if kind === 'inputSwitch'}
      <FigmaSwitch
        className="form-element element-type-switch"
        disabled={isDisabled}
        nameId={nameId}
        options={options}
        on:saveSignal
        bind:value={value}
        watchChange={selectWatchChange}
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
