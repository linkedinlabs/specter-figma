<script>
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();
  
  export let specPages = [];
  
  let [value] = specPages;
  let newSpecName = 'SPEC - ';
  $: warning = !newSpecName.includes('SPEC ');

  const submitValue = () => {
    parent.postMessage({
      pluginMessage: {
        action: 'generate',
        payload: {
          pageId: value ? value.id : null,
          newSpecName,
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
    margin: 14px 0 0 8px;
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
    <label for="new-spec-name" class="name-label">New page name: </label>
    <input id="new-spec-name" class="user-input" bind:value={newSpecName}/>
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
