<script>
  import { onDestroy } from 'svelte';
  import { compareArrays } from '../../utils/tools';
  import FormUnit from '../forms-controls/FormUnit';
  import ButtonRemove from '../forms-controls/ButtonRemove';

  export let isSelected = false;
  export let itemId = null;
  export let type = null;
  export let fields = [];

  const savedFields = [...fields];
  let newField = { name: '', val: '' };

  const updateField = (newFields) => {
    if (compareArrays(savedFields, newFields)) {
      fields = newFields;
      parent.postMessage({
        pluginMessage: {
          action: 'a11y-set-node-data',
          payload: {
            id: itemId,
            key: 'misc',
            value: newFields,
          },
        },
      }, '*');
    }
  };
  
  const addField = () => {
    fields.push(newField);
    newField = { name: '', val: '' };
    updateField(fields);
  };

  onDestroy(() => {
    updateField(fields.filter(field => field.name.trim().length));
  });
</script>

<style>
  /* components/list-item-content */
  .add-btn {
    color: rgb(107, 167, 107);
    font-size: 22px;
    background: white;
    border: none;
    cursor: pointer;
    height: 28px;
    width: 28px;
    padding: 0 10px 0 0;
  }
  .add-btn:hover {
    color: rgb(46, 85, 46);
  }
</style>

<article class:isSelected class={`item-content ${type}`}>
  {#each fields as field}
  <span class="form-element-holder inline">
    <FormUnit
      className="form-row slim light"
      kind="inputText"
      nameId={`${itemId}-misc-name-${field.name}`}
      placeholder="Name"
      hideLabel={true}
      inputWatchBlur={true}
      on:saveSignal={() => updateField(fields)}
      bind:value={field.name}
    />
    <FormUnit
      className="form-row"
      kind="inputText"
      nameId={`${itemId}-misc-val-${field.name + field.val}`}
      placeholder="Value"
      hideLabel={true}
      inputWatchBlur={true}
      on:saveSignal={() => updateField(fields)}
      bind:value={field.val}
    />
    <ButtonRemove
      on:handleUpdate={() => updateField(fields.filter(({ name }) => name !== field.name))}
    />
  </span>
  {/each}
  <span class="form-element-holder inline">
    <FormUnit
      className="form-row slim"
      kind="inputText"
      nameId={`${itemId}-misc-name`}
      placeholder="New name"
      hideLabel={true}
      bind:value={newField.name}
      />
    <FormUnit
      className="form-row"
      kind="inputText"
      nameId={`${itemId}-misc-value`}
      placeholder="New value"
      hideLabel={true}
      bind:value={newField.val}
      />
    <button class="add-btn" on:click={() => addField()}>+</button>
  </span>
</article>
    