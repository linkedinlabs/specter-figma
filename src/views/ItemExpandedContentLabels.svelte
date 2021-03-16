<script>
  import FormUnit from './forms-controls/FormUnit';
  import { deepCompare } from '../utils/tools';

  export let isSelected = false;
  export let itemId = null;
  export let role = null;
  export let type = null;
  export let labels = null;
  export let roleOptions;

  const labelsInit = {
    a11y: null,
    visible: false,
    alt: null,
  };

  let resetValue = false;
  let dirtyRole = role || 'no-role';
  let originalRole = role || 'no-role';
  let dirtyLabels = labels ? { ...labels } : { ...labelsInit };
  let originalLabels = labels ? { ...labels } : { ...labelsInit };

  const updateField = (key, value) => {
    const diff = key === 'role' ? value !== originalRole : deepCompare(value, originalLabels);
    
    if (diff) {
      parent.postMessage({
        pluginMessage: {
          action: 'a11y-set-aria-data',
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
        resetValue={resetValue}
        selectWatchChange={true}
        on:saveSignal={() => updateField('role', dirtyRole)}
        bind:value={dirtyRole}
      />
    </span>
    {#if (dirtyRole !== 'image-decorative')}
      {#if (dirtyRole === 'image')}
        <FormUnit
          className="form-row"
          kind="inputText"
          labelText="Alt text"
          nameId={`${itemId}-label-alt`}
          placeholder="Short description of the scene"
          resetValue={resetValue}
          inputWatchBlur={true}
          on:saveSignal={() => updateField('labels', dirtyLabels)}
          bind:value={dirtyLabels.alt}
        />
      {:else}
        <FormUnit
          className="form-row"
          kind="inputSwitch"
          labelText="Visible label"
          nameId={`${itemId}-label-visible`}
          placeholder="Leave empty to use a11y label"
          resetValue={resetValue}
          inputWatchBlur={true}
          on:saveSignal={() => updateField('labels', dirtyLabels)}
          bind:value={dirtyLabels.visible}
        />
        <FormUnit
          className="form-row"
          kind="inputText"
          labelText="A11y label"
          nameId={`${itemId}-label-a11y`}
          placeholder="Leave empty to use visible label"
          resetValue={resetValue}
          inputWatchBlur={true}
          on:saveSignal={() => updateField('labels', dirtyLabels)}
          bind:value={dirtyLabels.a11y}
        />
      {/if}
    {/if}
  </span>
</article>
