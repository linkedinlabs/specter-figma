<script>
  import FormUnit from './forms-controls/FormUnit';
  import { deepCompare } from '../utils/tools';

  export let isSelected = false;
  export let itemId = null;
  export let type = null;
  export let roleOptions;
  export let role;
  export let labels;

  const savedRole = role;
  const savedLabels = { ...labels };

  const updateField = (key, value) => {
    const changeDetected = key === 'role'
      ? value !== savedRole
      : deepCompare(savedLabels, value);

    if (changeDetected) {
      parent.postMessage({
        pluginMessage: {
          action: 'a11y-set-node-data',
          payload: {
            id: itemId,
            key,
            value,
          },
        },
      }, '*');
    }
  };

</script>

<style>
  /* components/list-item-content */
</style>

<article class:isSelected class={`item-content ${type}`}>
  <span class="form-element-holder">
    <span class="form-row">
      <FormUnit
        className="form-inner-row"
        kind="inputSelect"
        labelText="Role"
        nameId={`${itemId}-role`}
        options={roleOptions}
        selectWatchChange={true}
        on:saveSignal={() => updateField('role', role)}
        bind:value={role}
      />
    </span>
    {#if (role !== 'image-decorative')}
      {#if (role === 'image')}
        <FormUnit
          className="form-row"
          kind="inputText"
          labelText="Alt text"
          nameId={`${itemId}-label-alt`}
          placeholder="Short description of the scene"
          inputWatchBlur={true}
          on:saveSignal={() => updateField('labels', labels)}
          bind:value={labels.alt}
        />
      {:else}
        <FormUnit
          className="form-row"
          kind="inputSwitch"
          labelText="Visible text"
          nameId={`${itemId}-label-visible`}
          placeholder="Leave empty to use a11y label"
          inputWatchBlur={true}
          on:saveSignal={() => updateField('labels', labels)}
          bind:value={labels.visible}
        />
        <FormUnit
          className="form-row"
          kind="inputText"
          labelText="A11y label"
          nameId={`${itemId}-label-a11y`}
          placeholder="Leave empty to use visible text"
          inputWatchBlur={true}
          on:saveSignal={() => updateField('labels', labels)}
          bind:value={labels.a11y}
        />
      {/if}
    {/if}
  </span>
</article>
