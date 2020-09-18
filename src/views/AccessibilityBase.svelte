<script>
  import BlankState from './BlankState';

  export let selected = null;
  export let viewContext = 'a11y-keyboard';
</script>

{#if selected && selected.items.length > 0}
  Do the thing for {viewContext}
{:else}
  <BlankState/>
{/if}
