<script>
    import { afterUpdate, beforeUpdate } from 'svelte';
    import FormUnit from './forms-controls/FormUnit';
    import { deepCompare } from '../utils/tools';
  
    export let isSelected = false;
    export let itemId = null;
    export let type = null;
    export let heading = null;
    $: console.log('heading prop: ', heading)
  
    const headingInit = {
      level: null,
      visible: false,
      hiddenText: null,
    };
  
    let resetValue = false;
    let wasResetValue = false;
    let dirtyHeading = heading ? { ...heading } : { ...headingInit };
    let originalHeading = heading ? { ...heading } : { ...headingInit };
  
    const handleReset = () => {
      dirtyHeading = heading ? { ...heading } : { ...headingInit };
      originalHeading = heading ? { ...heading } : { ...headingInit };
      resetValue = true;
    };
  
    const updateHeading = (newHeading, key) => {
      console.log(newHeading)
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
        kind="inputText"
        inputType="number"
        labelText="Level"
        nameId={`${itemId}-heading-level`}
        placeholder="Leave empty to use browser default"
        resetValue={resetValue}
        inputWatchBlur={true}
        on:saveSignal={() => updateHeading(dirtyHeading, 'level')}
        bind:value={dirtyHeading.level}
      />
      <FormUnit
        className="form-row"
        kind="inputSwitch"
        labelText="Visible label"
        nameId={`${itemId}-heading-visible`}
        resetValue={resetValue}
        inputWatchBlur={true}
        on:saveSignal={() => updateHeading(dirtyHeading, 'visible')}
        bind:value={dirtyHeading.visible}
      />
      <FormUnit
        className="form-row"
        kind="inputText"
        labelText="Hidden text"
        nameId={`${itemId}-heading-text`}
        placeholder="Leave empty to use visible heading"
        resetValue={resetValue}
        inputWatchBlur={true}
        on:saveSignal={() => updateHeading(dirtyHeading, 'hiddenText')}
        bind:value={dirtyHeading.hiddenText}
      />
    </span>
  </article>
  