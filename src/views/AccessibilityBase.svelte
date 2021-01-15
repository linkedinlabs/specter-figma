<script>
  import BlankState from './BlankState';
  import ItemsList from './ItemsList';

  export let items = null;
  export let viewContext = 'a11y-keyboard';

</script>

{#if items && items.length > 0}
  {#if (viewContext !== 'a11y-headings')}
    <ItemsList
      on:handleAction
      items={items}
      type={viewContext}
    />
  {:else}
    Do the thing for {viewContext}
  {/if}
{:else}
  <BlankState/>
{/if}
