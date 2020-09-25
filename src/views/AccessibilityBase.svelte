<script>
  import BlankState from './BlankState';
  import ItemsList from './ItemsList';

  export let selected = null;
  export let viewContext = 'a11y-keyboard';
</script>

{#if selected && selected.items.length > 0}
  {#if (viewContext === 'a11y-keyboard')}
    <ItemsList
      on:handleAction
      selected={selected}
      type={viewContext}
    />
  {:else}
    Do the thing for {viewContext}
  {/if}
{:else}
  <BlankState/>
{/if}
