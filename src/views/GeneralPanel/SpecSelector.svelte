<script>
  import { createEventDispatcher } from 'svelte';
  
  export let specPages = [];
  
  const dispatch = createEventDispatcher();
  let [value] = specPages;
  let newSpecName = 'SPEC - ';
  let includeInstructions = true;
  $: warning = !newSpecName.includes('SPEC ');

  const submitValue = () => {
    parent.postMessage({
      pluginMessage: {
        action: 'generate',
        payload: {
          pageId: value ? value.id : null,
          newSpecName,
          includeInstructions: value ? false : includeInstructions,
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
  input {
    cursor: text;
  }
  .user-input {
    padding: 4px 8px;
    margin: 2px 8px 0 8px;
    align-items: flex-start;
    width: 95.75%;
  }
  .name-label {
    margin: 18px 0 0 8px;
  }
  .checkbox-wrapper {
    margin: 5px 0 0 5px;
    display: flex;
    align-items: center;
  }
  .checkbox-wrapper input,
  .checkbox-wrapper label {
    cursor: pointer;
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
  <h3>
    Choose a spec to add the template to…
  </h3>
  <select
    bind:value={value}
    class="user-input"
    placeholder="Choose a spec page…"
  >
    {#each specPages as spec} 
    <option value={spec}>{spec.name}</option>
    {/each}
    <option value={null}>Create new page...</option>
  </select>
  {#if !value}
    <label for="newSpecName" class="name-label">New page name: </label>
    <input id="newSpecName" class="user-input" bind:value={newSpecName}/>
    <div class="checkbox-wrapper">
      <input type="checkbox" id="instructionInput" bind:checked={includeInstructions}/>
      <label for="instructionInput">Include Instructions</label>
    </div>
    {#if warning}
      <p class="warning-msg">Warning: Page name must include 'SPEC ' to be included in the options above in future.</p>
    {/if}
  {/if}
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
