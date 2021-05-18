<script>
  import { createEventDispatcher } from 'svelte';
  import FormUnit from '../forms-controls/FormUnit';
  import ExpandCollapse from '../forms-controls/ExpandCollapse';
  
  export let specPages = [];
  const specOptions = specPages.map(({id, name}) => ({ text: name, value: id}));
  specOptions.unshift({text: 'Create new page', value: 'no-page'});
  console.log(specOptions)
  
  const dispatch = createEventDispatcher();
  let selectedPage = specOptions[0].value;
  let newSpecName = 'SPEC - ';
  let includeInstructions = true;
  $: warning = !newSpecName.includes('SPEC ');

  const submitValue = () => {
    parent.postMessage({
      pluginMessage: {
        action: 'generate',
        payload: {
          pageId: selectedPage.value !== 'no-page' ? selectedPage.value : null,
          newSpecName,
          includeInstructions: selectedPage.value !== 'no-page' ? false : includeInstructions,
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

</script>

<style>
  .user-input {
    padding: 15px;
    margin: 0;
    align-items: flex-start;
    justify-content: space-between;
    height: 100vh;
  }
  .spec-form {
    width: 100%;
  }
  p {
    text-align: left;
    padding: 8px 6px 18px 6px;
  }
  .checkbox-wrapper {
    display: flex;
    height: 32px;
    align-items: center;
    padding: 6px;
  }
  .warning-msg {
    font-size: 10px;
    color: rgb(189, 92, 13);
    margin: 2px 0 0 10px;
    text-align: left;
  }
  .form-actions {
    margin-top: 14px;
  }
</style>

<section
  on:keyup={watchKeys}
  class="user-input"
>
<div class="spec-form">
  <p>
    Generate a spec using <strong>1 selected</strong> top-level frame. Specter will create a spec template for design system components and foundations, keyboard, labels, and headings.
  </p>
  <!-- <select
    bind:value={value}
    class="user-input"
    placeholder="Choose a spec page…"
  >
    {#each specPages as spec} 
    <option value={spec}>{spec.name}</option>
    {/each}
    <option value={null}>Create new page...</option>
  </select> -->
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
  <!-- </span> -->
  {#if selectedPage.value !== 'no-page'}
  <!-- <label for="newSpecName" class="name-label">New page name: </label>
  <input id="newSpecName" class="user-input" bind:value={newSpecName}/>
  <div class="checkbox-wrapper">
    <input type="checkbox" id="instructionInput" bind:checked={includeInstructions}/>
    <label for="instructionInput">Include Instructions</label>
  </div> -->
    <!-- <span class="form-element-holder"> -->
      <span class="form-row">
        <FormUnit
          className="form-inner-row"
          kind="inputText"
          labelText="Page Name"
          bind:value={newSpecName}
        />
      </span>
      {#if warning}
        <p class="warning-msg">Warning: Page name must include 'SPEC ' to be included in the options above in future.</p>
      {/if}
      <div class="checkbox-wrapper">
        <input type="checkbox" id="instructionInput" bind:checked={includeInstructions}/>
        <label for="instructionInput">Include Instructions</label>
      </div>
    {/if}
    </span>
  <!-- <ExpandCollapse name='Advanced options'/> -->
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
