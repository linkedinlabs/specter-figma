<script>
  import { afterUpdate, beforeUpdate } from 'svelte';
  import FormUnit from './forms-controls/FormUnit';
  import { deepCompare } from '../utils/tools';

  export let isSelected = false;
  export let itemId = null;
  export let type = null;
  export let heading = null;

  const headingInit = {
    level: 'no-level',
    visible: true,
    invisible: null,
  };

  let resetValue = false;
  let wasResetValue = false;
  let dirtyHeading = heading ? { ...heading } : { ...headingInit };
  let originalHeading = heading ? { ...heading } : { ...headingInit };

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

  const handleReset = () => {
    dirtyHeading = heading ? { ...heading } : { ...headingInit };
    originalHeading = heading ? { ...heading } : { ...headingInit };
    resetValue = true;
  };

  const updateHeading = (newHeading, key) => {
    if (originalHeading[key] !== newHeading[key]) {
      parent.postMessage({
        pluginMessage: {
          action: `${type}-set-heading`,
          payload: {
            id: itemId,
            heading: newHeading,
          },
        },
      }, '*');
      handleReset();
    }
  };

  beforeUpdate(() => {
    if (heading && deepCompare(originalHeading, heading)) {
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
    <FormUnit
      className="form-row"
      kind="inputSelect"
      options={levelOptions}
      labelText="Level"
      nameId={`${itemId}-heading-level`}
      placeholder="Leave empty to use browser default"
      resetValue={resetValue}
      selectWatchChange={true}
      on:saveSignal={() => updateHeading(dirtyHeading, 'level')}
      bind:value={dirtyHeading.level}
    />
    <FormUnit
      className="form-row"
      kind="inputSwitch"
      labelText="Visible"
      nameId={`${itemId}-heading-visible`}
      resetValue={resetValue}
      inputWatchBlur={true}
      on:saveSignal={() => updateHeading(dirtyHeading, 'visible')}
      bind:value={dirtyHeading.visible}
    />
    {#if dirtyHeading && !dirtyHeading.visible}
      <FormUnit
        className="form-row"
        kind="inputText"
        labelText="Heading"
        nameId={`${itemId}-heading-invisible`}
        placeholder="e.g. 'Skip for now'"
        resetValue={resetValue}
        inputWatchBlur={true}
        on:saveSignal={() => updateHeading(dirtyHeading, 'invisible')}
        bind:value={dirtyHeading.invisible}
      />
    {/if}
  </span>
</article>
  