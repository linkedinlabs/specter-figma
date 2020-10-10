<script>
  import { beforeUpdate } from 'svelte';
  import { openItems } from './stores';

  import ButtonAddStop from './forms-controls/ButtonAddStop';
  import ItemExpandedContent from './ItemExpandedContent';
  import ItemHeader from './ItemHeader';

  // props
  export let items = null;
  export let type = null;

  // locals
  let itemsDirty = items;
  let addNumber = 0;

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

  const setAddStopButton = (currentItems) => {
    addNumber = 0;

    currentItems.forEach((item) => {
      if (!item.hasStop) {
        addNumber += 1;
      }
    });
  };

  beforeUpdate(() => {
    itemsDirty = items;
    setAddStopButton(itemsDirty);
  });
</script>

<section class="items-list-holder">
  <ul class="items-list">
    {#each itemsDirty.filter(filterItem => filterItem.hasStop) as item, i (item.id)}
      <li class="single-item">
        <ItemHeader
          on:handleUpdate={customEvent => updateItemState(item.id, customEvent.detail, type)}
          isOpen={checkIsOpen(item.id, type)}
          isSelected={item.isSelected}
          itemId={item.id}
          labelText={item.name}
          position={item.position}
          type={type}
        />
        {#if checkIsOpen(item.id, type)}
          <ItemExpandedContent
            itemId={item.id}
            isSelected={item.isSelected}
            type={type}
          />
        {/if}
      </li>
    {/each}
  </ul>
  <ButtonAddStop
    on:handleAction
    disabled={addNumber < 1}
    number={addNumber}
    type={type}
  />
</section>
