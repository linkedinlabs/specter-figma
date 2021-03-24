<script>
  import BlankState from './BlankState';
  import ItemsList from './ItemsList';

  export let items;
  export let viewContext = 'a11y-keyboard';
</script>

{#if items && items.length}
  <ItemsList
    on:handleAction
    items={items}
    type={viewContext}
  />
{:else}
  <BlankState/>
{/if}
