<script>
  import FormUnit from '../forms-controls/FormUnit';
  import { deepCompare } from '../../utils/tools';

  export let isSelected = false;
  export let itemId = null;
  export let type = null;
  export let roleOptions;
  export let role;
  export let labels;

  const savedRole = role;
  const savedLabels = { ...labels };

  const updateField = (key, value) => {
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
  };

  $: if (savedRole !== role) {
    updateField('role', role);
  }

  $: if (deepCompare(savedLabels, labels)) {
    updateField('labels', labels);
  }

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
          bind:value={labels.alt}
        />
      {:else}
        <FormUnit
          className="form-row"
          kind="inputSwitch"
          labelText="Visible text"
          nameId={`${itemId}-label-visible`}
          bind:value={labels.visible}
        />
        <FormUnit
          className="form-row"
          kind="inputText"
          labelText="A11y label"
          nameId={`${itemId}-label-a11y`}
          placeholder="Leave empty to use visible text"
          bind:value={labels.a11y}
        />
      {/if}
    {/if}
  </span>
</article>
