<script>
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import FormUnit from '../forms-controls/FormUnit';
  import FigmaSwitch from '../forms-controls/FigmaSwitch';
  import ExpandCollapse from '../forms-controls/ExpandCollapse';
  
  export let specPages = [];

  const settings = {
    instructions: true,
    designSystem: true,
    keyboard: true,
    label: true,
    heading: true,
    misc: false,
  };
  
  const dispatch = createEventDispatcher();
  const specOptions = specPages.map(({ id, name }) => ({ text: name, value: id }));
  specOptions.unshift({ text: 'Create new page', value: 'no-page' });
  
  let selectedPage = specOptions[0].value;
  let newSpecName = 'SPEC - ';

  $: warning = !newSpecName.includes('SPEC ');
  $: newPage = selectedPage !== 'no-page';
  
  const submitValue = () => {
    parent.postMessage({
      pluginMessage: {
        action: 'generate',
        payload: {
          pageId: newPage ? selectedPage : null,
          newSpecName,
          settings,
        },
      },
    }, '*');

    dispatch('handleAction', 'close');
  };

  const watchKeys = (event) => {
    const { key } = event;

    if ((key === 'Enter') || (key === 'NumpadEnter')) {
      submitValue();
    }

    if (key === 'Escape') {
      dispatch('handleAction', 'close');
    }
  };

  const resizeWindow = (bodyHeight) => {
    parent.postMessage({
      pluginMessage: {
        action: 'resize',
        payload: { bodyHeight },
      },
    }, '*');
  };

  onMount(() => {
    resizeWindow(220);
  });

  onDestroy(() => {
    resizeWindow(220);
  });

</script>

<style>
  /* components/spec-selector */
</style>

<section
  on:keyup={watchKeys}
  class="user-input spec-selector"
>
<div class="spec-form">
  <p>
    Generate a spec using <strong>selected</strong> top-level frame(s). Specter will create a spec template for design system components and foundations, keyboard, labels, and headings.
  </p>
  <span class="form-element-holder full">
    <span class="form-row">
      <FormUnit
        className="form-inner-row"
        kind="inputSelect"
        labelText="Page"
        options={specOptions}
        bind:value={selectedPage}
      />
    </span>
    {#if selectedPage === 'no-page'}
      <span class="form-row">
        <FormUnit
          className="form-inner-row"
          kind="inputText"
          labelText="Page Name"
          focused
          bind:value={newSpecName}
        />
      </span>
      <p class="warning-msg" class:hidden={!warning}>Name must include 'SPEC ' to be in the page options above in future.</p>
      <ExpandCollapse name='Advanced options' on:handleClick={e => resizeWindow(e.detail ? 450 : 220)}>
        <span class="form-row setting" class:expanded={settings.instructions}>
          Instructions 
          <FigmaSwitch
            className="form-element element-type-switch"
            on:click={() => { settings.instructions = !settings.instructions; }}
            value={settings.instructions}
          />
        </span>
          <span class="form-row setting">
            Design system components & spacing
            <FigmaSwitch
              className="form-element element-type-switch"
              on:click={() => { settings.designSystem = !settings.designSystem; }}
              value={settings.designSystem}
            />
          </span>
          <span class="form-row setting">
            Keyboard 
            <FigmaSwitch
              className="form-element element-type-switch"
              on:click={() => { settings.keyboard = !settings.keyboard; }}
              value={settings.keyboard}
            />
          </span>
          <span class="form-row setting">
            Labels 
            <FigmaSwitch
              className="form-element element-type-switch"
              on:click={() => { settings.label = !settings.label; }}
              value={settings.label}
            />
          </span>
          <span class="form-row setting">
            Headings 
            <FigmaSwitch
              className="form-element element-type-switch"
              on:click={() => { settings.heading = !settings.heading; }}
              value={settings.heading}
            />
          </span>
          <span class="form-row setting">
            Misc (blank)
            <FigmaSwitch
              className="form-element element-type-switch"
              on:click={() => { settings.misc = !settings.misc; }}
              value={settings.misc}
            />
          </span>
      </ExpandCollapse>
    {/if}
  </span>
</div>
  <p class="form-actions">
    <button
      on:click={() => dispatch('handleAction', 'close')}
      class="button button--secondary button--margin-right"
    >
      Cancel
    </button>
    <button
      on:click={() => submitValue()}
      class="button button--primary"
    >
      OK
    </button>
  </p>
</section>
