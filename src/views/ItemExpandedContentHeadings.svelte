<script>
  import FormUnit from './forms-controls/FormUnit';
  import { deepCompare } from '../utils/tools';
  import { LEVEL_OPTS } from '../constants';

  export let isSelected = false;
  export let itemId = null;
  export let type = null;
  export let heading;

  const savedHeading = { ...heading };

  const updateHeading = (newHeading) => {
    if (deepCompare(savedHeading, newHeading)) {
      parent.postMessage({
        pluginMessage: {
          action: 'a11y-set-node-data',
          payload: {
            id: itemId,
            key: 'heading',
            value: newHeading,
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
    <FormUnit
      className="form-row"
      kind="inputSelect"
      options={LEVEL_OPTS}
      labelText="Level"
      nameId={`${itemId}-heading-level`}
      placeholder="Leave empty to use browser default"
      selectWatchChange={true}
      on:saveSignal={() => updateHeading(heading)}
      bind:value={heading.level}
    />
    <FormUnit
      className="form-row"
      kind="inputSwitch"
      labelText="Visible text"
      nameId={`${itemId}-heading-visible`}
      inputWatchBlur={true}
      on:saveSignal={() => updateHeading(heading)}
      bind:value={heading.visible}
    />
    {#if heading && !heading.visible}
      <FormUnit
        className="form-row"
        kind="inputText"
        labelText="A11y label"
        nameId={`${itemId}-heading-invisible`}
        placeholder="e.g. 'Skip for now'"
        inputWatchBlur={true}
        on:saveSignal={() => updateHeading(heading)}
        bind:value={heading.invisible}
      />
    {/if}
  </span>
</article>
  