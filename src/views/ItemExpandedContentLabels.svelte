<script>
  import FormUnit from './forms-controls/FormUnit';
  import { deepCompare } from '../utils/tools';

  export let isSelected = false;
  export let itemId = null;
  export let type = null;
  export let role = null;
  export let labels = null;
  export let roleOptions;

  const labelsInit = {
    a11y: null,
    visible: false,
    alt: null,
  };

  const savedRole = role || 'no-role';
  const savedLabels = labels ? { ...labels } : { ...labelsInit };

  const updateField = (key, value) => {
    const diff = key === 'role' ? value !== savedRole : deepCompare(value, savedLabels);

    if (diff) {
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
          labelText="Visible label"
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
          placeholder="Leave empty to use visible label"
          inputWatchBlur={true}
          on:saveSignal={() => updateField('labels', labels)}
          bind:value={labels.a11y}
        />
      {/if}
    {/if}
  </span>
</article>
