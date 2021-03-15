<script>
  import { beforeUpdate } from 'svelte';
  import { openItems } from './stores';

  import ButtonAddStop from './forms-controls/ButtonAddStop';
  import ItemExpandedContentKeystops from './ItemExpandedContentKeystops';
  import ItemExpandedContentLabels from './ItemExpandedContentLabels';
  import ItemExpandedContentHeadings from './ItemExpandedContentHeadings';
  import ItemHeader from './ItemHeader';

  // props
  export let items = null;
  export let type = null;

  // locals
  let itemsDirty = items;
  let addNumber = 0;
  const roleOptions = [
    {
      value: 'no-role',
      text: 'None',
      disabled: false,
    },
    {
      value: 'divider--01',
      text: null,
      disabled: true,
    },
    {
      value: 'image',
      text: 'Image',
      disabled: false,
    },
    {
      value: 'image-decorative',
      text: 'Image (decorative)',
      disabled: false,
    },
    {
      value: 'divider--02',
      text: null,
      disabled: true,
    },
    {
      value: 'button',
      text: 'Button',
      disabled: false,
    },
    {
      value: 'checkbox',
      text: 'Checkbox',
      disabled: false,
    },
    {
      value: 'link',
      text: 'Link',
      disabled: false,
    },
    {
      value: 'menuitem',
      text: 'Menu item',
      disabled: false,
    },
    {
      value: 'menuitemcheckbox',
      text: 'Menu item (checkbox)',
      disabled: false,
    },
    {
      value: 'menuitemradio',
      text: 'Menu item (radio)',
      disabled: false,
    },
    {
      value: 'option',
      text: 'Option',
      disabled: false,
    },
    {
      value: 'progressbar',
      text: 'Progress bar',
      disabled: false,
    },
    {
      value: 'radio',
      text: 'Radio',
      disabled: false,
    },
    {
      value: 'searchbox',
      text: 'Search box',
      disabled: false,
    },
    {
      value: 'slider',
      text: 'Slider',
      disabled: false,
    },
    {
      value: 'switch',
      text: 'Switch',
      disabled: false,
    },
    {
      value: 'tab',
      text: 'Tab',
      disabled: false,
    },
    {
      value: 'tabpanel',
      text: 'Tab panel',
      disabled: false,
    },
    {
      value: 'textbox',
      text: 'Textbox',
      disabled: false,
    },
    {
      value: 'divider--03',
      text: null,
      disabled: true,
    },
    {
      value: 'combobox',
      text: 'Combobox',
      disabled: false,
    },
    {
      value: 'listbox',
      text: 'Listbox',
      disabled: false,
    },
    {
      value: 'menu',
      text: 'Menu',
      disabled: false,
    },
    {
      value: 'radiogroup',
      text: 'Radio group',
      disabled: false,
    },
    {
      value: 'tablist',
      text: 'Tab list',
      disabled: false,
    },
  ];

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

  const isMissingData = (item) => {
    const { labels, role, heading } = item;
    let result = false;
    if (type.includes('labels') && item.role !== 'image-decorative') {
      result = (
        !labels
        || (role === 'image' && !labels.alt)
        || (role !== 'image' && !(labels.a11y || labels.visible))
      );
    } else if (type.includes('heading')) {
      result = heading && !(heading.visible || heading.invisible);
    }
    return result;
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

  const getHeaderName = (item) => {
    const { name, role } = item;
    const { a11y, visible, alt } = item.labels || {};
    const mainText = role && role !== 'no-role' ? roleOptions.find(i => i.value === role).text : '';
    let headerName = name;

    if (role === 'image-decorative') {
      headerName = name;
    } else if (role === 'image') {
      const secondaryText = alt ? `"${alt}"` : '(missing alt text)';
      headerName = `${mainText} ${secondaryText}`;
    } else if (a11y) {
      headerName = `${mainText} "${a11y}"`;
    } else if (!visible) {
      headerName = `${name} (missing label)`;
    }
    return headerName;
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
          ariaNamed={type.includes('labels') && !getHeaderName(item).includes(item.name)}
          isSelected={item.isSelected}
          itemId={item.id}
          labelText={type.includes('labels') ? getHeaderName(item) : item.name}
          position={item.position}
          type={type}
          showErrorIcon={isMissingData(item)}
        />
        {#if checkIsOpen(item.id, type)}
          {#if (type === 'a11y-keyboard')}
            <ItemExpandedContentKeystops
              itemId={item.id}
              isSelected={item.isSelected}
              keys={item.keys}
              type={type}
            />
          {:else if (type === 'a11y-labels')}
            <ItemExpandedContentLabels
              itemId={item.id}
              isSelected={item.isSelected}
              labels={item.labels}
              role={item.role}
              roleOptions={roleOptions}
              type={type}
              on:handleUpdate={() => {}}
            />
            {:else if (type === 'a11y-headings')}
            <ItemExpandedContentHeadings
              itemId={item.id}
              isSelected={item.isSelected}
              heading={item.heading}
              type={type}
              on:handleUpdate={() => {}}
            />
          {/if}
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
