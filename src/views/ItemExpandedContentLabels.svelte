<script>
  import { afterUpdate, beforeUpdate } from 'svelte';
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
    visible: null,
    alt: null,
  };

  let resetValue = false;
  let wasResetValue = false;
  let dirtyRole = role || 'no-role';
  let originalRole = role || 'no-role';
  let dirtyLabels = labels ? { ...labels } : { ...labelsInit };
  let originalLabels = labels ? { ...labels } : { ...labelsInit };

  const handleReset = () => {
    // role
    dirtyRole = role || 'no-role';
    originalRole = role || 'no-role';

    // labels
    dirtyLabels = labels ? { ...labels } : { ...labelsInit };
    originalLabels = labels ? { ...labels } : { ...labelsInit };

    resetValue = true;
  };

  const updateLabel = (newLabels, key) => {
    if (originalLabels[key] !== newLabels[key]) {
      parent.postMessage({
        pluginMessage: {
          action: `${type}-set-text`,
          payload: {
            id: itemId,
            labels: newLabels,
          },
        },
      }, '*');
      handleReset();
    }
  };

  const updateRole = (newRole) => {
    if (originalRole !== newRole) {
      parent.postMessage({
        pluginMessage: {
          action: `${type}-set-role`,
          payload: {
            id: itemId,
            role: newRole,
          },
        },
      }, '*');
      handleReset();
    }
  };

  beforeUpdate(() => {
    if (
      (role && (originalRole !== role))
      || (labels && deepCompare(originalLabels, labels))
    ) {
      resetValue = true;
    }

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
        on:saveSignal={() => updateRole(dirtyRole)}
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
          on:saveSignal={() => updateLabel(dirtyLabels, 'alt')}
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
          on:saveSignal={() => updateLabel(dirtyLabels, 'visible')}
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
          on:saveSignal={() => updateLabel(dirtyLabels, 'a11y')}
          bind:value={dirtyLabels.a11y}
        />
      {/if}
    {/if}
  </span>
</article>
