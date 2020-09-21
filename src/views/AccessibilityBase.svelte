<script>
  import BlankState from './BlankState';
  import ItemsList from './ItemsList';

  export let selected = null;
  export let viewContext = 'a11y-keyboard';
</script>

{#if selected && selected.items.length > 0}
  Do the thing for {viewContext}
  <ItemsList
    selected={selected}
    type={viewContext}
  />
{:else}
  <BlankState/>
{/if}
