<script>
  import { beforeUpdate } from 'svelte';
  // import { openItems } from './stores';
  import ItemExpandedContent from './ItemExpandedContent';
  import ItemHeader from './ItemHeader';

  // props
  export let selected = null;
  export let type = null;

  // locals
  let { items } = selected;

  const checkIsOpen = (itemId) => {
    let itemIsOpen = false;

    // tktk
    // // check the store to see if an entry exists
    // const itemIndex = $openItems.findIndex(foundId => (foundId === itemId));

    // // if the index exists, the item is open
    // if (itemIndex > -1) {
    //   itemIsOpen = true;
    // }

    return itemIsOpen;
  };

  const updateItemState = (itemId, operationType) => {
    console.log('update me'); // eslint-disable-line no-console
  };

  beforeUpdate(() => {
    items = selected.items;
  });
</script>

<section>
  <ul class="items-list">
    {#each items as item (item.id)}
      <li>
        <ItemHeader
          on:handleUpdate={customEvent => updateItemState(item.id, type)}
          isOpen={checkIsOpen(type.id)}
          type={type}
        />
        {#if checkIsOpen(item.id)}
          <ItemExpandedContent
            item={item}
          />
        {/if}
      </li>
    {/each}
  </ul>
</section>
