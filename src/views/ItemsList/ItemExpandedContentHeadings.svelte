<script>
  import FormUnit from '../forms-controls/FormUnit';
  import { deepCompare } from '../../utils/tools';
  import { LEVEL_OPTS } from '../../constants';

  export let isSelected = false;
  export let itemId = null;
  export let type = null;
  export let heading;

  const savedHeading = { ...heading };

  const updateHeading = () => {
    parent.postMessage({
      pluginMessage: {
        action: 'a11y-set-node-data',
        payload: {
          id: itemId,
          key: 'heading',
          value: heading,
        },
      },
    }, '*');
  };

  $: if (deepCompare(savedHeading, heading)) {
    updateHeading();
  }

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
      bind:value={heading.level}
    />
    <FormUnit
      className="form-row"
      kind="inputSwitch"
      labelText="Visible text"
      nameId={`${itemId}-heading-visible`}
      bind:value={heading.visible}
    />
    {#if heading && !heading.visible}
      <FormUnit
        className="form-row"
        kind="inputText"
        labelText="A11y label"
        nameId={`${itemId}-heading-invisible`}
        placeholder="e.g. 'Skip for now'"
        bind:value={heading.invisible}
      />
    {/if}
  </span>
</article>
  