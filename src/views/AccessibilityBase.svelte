<script>
  import BlankState from './BlankState';
  import ItemsList from './ItemsList';

  export let items = null;
  export let viewContext = 'a11y-keyboard';
  $: console.log(items)
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
