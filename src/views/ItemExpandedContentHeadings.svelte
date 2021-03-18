<script>
  import FormUnit from './forms-controls/FormUnit';
  import { deepCompare } from '../utils/tools';

  const headingInit = {
    level: 'no-level',
    visible: true,
    invisible: null,
  };

  export let isSelected = false;
  export let itemId = null;
  export let type = null;
  export let heading = { ...headingInit };

  let dirtyHeading = heading ? { ...heading } : { ...headingInit };

  const levelOptions = [
    {
      value: 'no-level',
      text: 'None  (iOS/Android)',
      disabled: false,
    },
    {
      value: 'divider--01',
      text: null,
      disabled: true,
    },
    {
      value: '1',
      text: '1',
      disabled: false,
    },
    {
      value: '2',
      text: '2',
      disabled: false,
    },
    {
      value: '3',
      text: '3',
      disabled: false,
    },
    {
      value: '4',
      text: '4',
      disabled: false,
    },
    {
      value: '5',
      text: '5',
      disabled: false,
    },
    {
      value: '6',
      text: '6',
      disabled: false,
    },
  ];

  const updateHeading = (newHeading) => {
    if (deepCompare(heading, newHeading)) {
      parent.postMessage({
        pluginMessage: {
          action: 'a11y-set-aria-data',
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
      options={levelOptions}
      labelText="Level"
      nameId={`${itemId}-heading-level`}
      placeholder="Leave empty to use browser default"
      selectWatchChange={true}
      on:saveSignal={() => updateHeading(dirtyHeading)}
      bind:value={dirtyHeading.level}
    />
    <FormUnit
      className="form-row"
      kind="inputSwitch"
      labelText="Visible"
      nameId={`${itemId}-heading-visible`}
      inputWatchBlur={true}
      on:saveSignal={() => updateHeading(dirtyHeading)}
      bind:value={dirtyHeading.visible}
    />
    {#if dirtyHeading && !dirtyHeading.visible}
      <FormUnit
        className="form-row"
        kind="inputText"
        labelText="Heading"
        nameId={`${itemId}-heading-invisible`}
        placeholder="e.g. 'Skip for now'"
        inputWatchBlur={true}
        on:saveSignal={() => updateHeading(dirtyHeading)}
        bind:value={dirtyHeading.invisible}
      />
    {/if}
  </span>
</article>
  