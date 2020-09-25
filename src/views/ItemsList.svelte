<script>
  import { createEventDispatcher, beforeUpdate } from 'svelte';
  import { openItems } from './stores';

  import ButtonAction from './forms-controls/ButtonAction';
  import ItemExpandedContent from './ItemExpandedContent';
  import ItemHeader from './ItemHeader';

  // props
  export let selected = null;
  export let type = null;

  const dispatch = createEventDispatcher();

  // locals
  let { items } = selected;

  const checkIsOpen = (itemId, typeScope) => {
    let itemIsOpen = false;

    // check the store to see if an entry exists
    const typedId = `${typeScope}-${itemId}`;
    const itemIndex = $openItems.findIndex(foundId => foundId === typedId);

    // if the index exists, the item is open
    if (itemIndex > -1) {
      itemIsOpen = true;
    }

    return itemIsOpen;
  };

  const updateItemState = (itemId, operationType = 'toggleOpen', typeScope) => {
    const typedId = `${typeScope}-${itemId}`;

    const addOrRemoveEntry = (itemsArray) => {
      let updatedItemsArray = itemsArray;
      const itemIndex = $openItems.findIndex(foundId => foundId === typedId);

      // add or remove entry
      if (itemIndex > -1) {
        updatedItemsArray = [
          ...updatedItemsArray.slice(0, itemIndex),
          ...updatedItemsArray.slice(itemIndex + 1),
        ];
      } else {
        updatedItemsArray.push(typedId);
      }

      return updatedItemsArray;
    };

    const removeEntry = (itemsArray) => {
      let updatedItemsArray = itemsArray;
      const itemIndex = $openItems.findIndex(foundId => foundId === typedId);

      // add or remove entry
      if (itemIndex > -1) {
        updatedItemsArray = [
          ...updatedItemsArray.slice(0, itemIndex),
          ...updatedItemsArray.slice(itemIndex + 1),
        ];
      }

      return updatedItemsArray;
    };

    const addEntry = (itemsArray) => {
      // remove first to prevent duplicates
      const updatedItemsArray = removeEntry(itemsArray);
      updatedItemsArray.push(typedId);

      return updatedItemsArray;
    };

    console.log(`update me: ${itemId} – ${operationType}`); // eslint-disable-line no-console

    // ---- toggle `isOpen`
    if (operationType === 'toggleOpen') {
      // retrieve open list from store and check for existing entry
      const updatedOpenItems = addOrRemoveEntry($openItems);

      // commit updated list to store
      openItems.set(updatedOpenItems);
    }

    // ---- force open
    if (operationType === 'setOpen') {
      // retrieve open list from store and check for existing entry
      const updatedOpenItems = addEntry($openItems);

      // commit updated list to store
      openItems.set(updatedOpenItems);
    }

    // ---- force closed
    if (operationType === 'setClosed') {
      // retrieve open list from store and check for existing entry
      const updatedOpenItems = removeEntry($openItems);

      // commit updated list to store
      openItems.set(updatedOpenItems);
    }
  };

  beforeUpdate(() => {
    items = selected.items;
  });
</script>

<section class="items-list-holder">
  <ul class="items-list">
    {#each items as item, i (item.id)}
      <li>
        <ItemHeader
          on:handleUpdate={customEvent => updateItemState(item.id, customEvent.detail, type)}
          isOpen={checkIsOpen(item.id, type)}
          itemId={item.id}
          position={i + 1}
          type={type}
        />
        {#if checkIsOpen(item.id, type)}
          <ItemExpandedContent
            itemId={item.id}
            type={type}
          />
        {/if}
      </li>
    {/each}
  </ul>
  <ButtonAction
    on:handleAction={() => dispatch('handleAction', `${type}-add-stop`)}
    action="corners"
    className="add-stop"
    isReversed={true}
    text="Add focus stop…"
  >
    <svg viewBox="0 0 32 32">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M15.5 15.5V10.5H16.5V15.5H21.5V16.5H16.5V21.5H15.5V16.5H10.5V15.5H15.5Z"/>
    </svg>
  </ButtonAction>
</section>
