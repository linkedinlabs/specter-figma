<script>
  // this component is a svelte rebuild of the vendor/figma-select-menu.js script
  // used in other LinkedIn Figma plugins
  import { afterUpdate, onMount } from 'svelte';

  export let className = null;
  export let disabled = false;
  export let nameId = null;
  export let value = null;
  export let options = [
    {
      value: 'unassigned',
      text: 'Not assigned',
      disabled: false,
    },
  ];

  // state
  let isMenuOpen = false;
  let selected = {
    value,
    text: null,
  };

  // ui
  let fauxSelectorElement = null;
  let selectorContainerElement = null;
  let scrollY = null;

  const isSelected = (
    toMatch,
    currentSelected,
    currentValue,
  ) => {
    if (currentSelected.value === null) {
      if (toMatch === currentValue) {
        return true;
      }
      return false;
    }

    if (toMatch === currentSelected.value) {
      return true;
    }
    return false;
  };

  const setSelected = (optionValue = value) => {
    const index = 0;
    let valueToCompare = optionValue;

    // set a string for blanks in select
    if (valueToCompare === null) {
      valueToCompare = 'blank--value';
    }

    // update for faux select
    if (valueToCompare) {
      selected = options.filter(option => option.value === valueToCompare)[index];
    } else {
      selected = options[index];
    }

    // update for real select + return binding
    value = selected.value;
    return selected;
  };

  // ui interactions
  const handleMenuClick = () => {
    isMenuOpen = !isMenuOpen;
    return isMenuOpen;
  };

  const handleItemClick = (optionValue) => {
    setSelected(optionValue);
    isMenuOpen = false;
  };

  const handleClickOutside = (event) => {
    if (!isMenuOpen) {
      return null;
    }

    let clickOutside = true;
    let parent = event.target;
    while (parent) {
      if (parent === fauxSelectorElement) {
        clickOutside = false;
      }
      parent = parent.parentNode;
    }

    if (clickOutside) {
      return handleMenuClick();
    }
    return null;
  };

  const watchKeys = (event) => {
    if (!isMenuOpen) {
      return null;
    }

    const selectNext = (direction) => {
      let currentlySelectedItem = selectorContainerElement.querySelector('.styled-select__list--active .styled-select__list-item--indicate');
      if (!currentlySelectedItem) {
        currentlySelectedItem = selectorContainerElement.querySelector('.styled-select__list--active .styled-select__list-item--active');
      }
      if (currentlySelectedItem) {
        const dropdown = currentlySelectedItem.parentNode;

        // default is `down`, grab the next sibling
        let nextSelectedItem = currentlySelectedItem.nextSibling;
        if (direction === 'up') {
          // grab the previous sibling
          nextSelectedItem = currentlySelectedItem.previousSibling;

          // skip over separators
          if (nextSelectedItem && nextSelectedItem.tagName !== 'LI') {
            nextSelectedItem = nextSelectedItem.previousSibling;
          }

          // if the previous sibling is missing, must be at the top
          // grab the last element in the list
          if (!nextSelectedItem) {
            nextSelectedItem = currentlySelectedItem.parentNode.lastChild;
          }
        } else {
          // skip over separators
          if (nextSelectedItem && nextSelectedItem.tagName !== 'LI') {
            nextSelectedItem = nextSelectedItem.nextSibling;
          }

          // if the next sibling is missing, must be at the bottom
          // grab the first element in the list
          if (!nextSelectedItem) {
            nextSelectedItem = currentlySelectedItem.parentNode.firstChild;
          }
        }

        currentlySelectedItem.classList.remove('styled-select__list-item--indicate');
        nextSelectedItem.classList.add('styled-select__list-item--indicate');

        const dropdownHeight = dropdown.offsetHeight;
        const selectedItem = dropdown.querySelector('.styled-select__list-item--indicate');
        const selectedItemHeight = selectedItem.offsetHeight;
        const selectedItemTopOffset = selectedItem.getBoundingClientRect().top + scrollY;
        const refreshedMenuTopInnerOffset = dropdown.getBoundingClientRect().top + scrollY;

        if (
          (selectedItemTopOffset < 0)
          || ((selectedItemTopOffset + selectedItemHeight) > dropdownHeight)
        ) {
          const scrollPoint = selectedItemTopOffset - refreshedMenuTopInnerOffset;
          dropdown.scrollTop = scrollPoint;
        }
      }
    };

    const commitSelectedValue = () => {
      let currentlySelectedItem = selectorContainerElement.querySelector('.styled-select__list--active .styled-select__list-item--indicate');
      const previouslySelectedItem = selectorContainerElement.querySelector('.styled-select__list--active .styled-select__list-item--active');
      if (!currentlySelectedItem) {
        currentlySelectedItem = selectorContainerElement.querySelector('.styled-select__list--active .styled-select__list-item--active');
      }
      const selectedValue = currentlySelectedItem.getAttribute('data-value');

      // update the faux menu selected item
      previouslySelectedItem.classList.remove('styled-select__list-item--active');
      currentlySelectedItem.classList.add('styled-select__list-item--active');
      currentlySelectedItem.classList.remove('styled-select__list-item--indicate');

      // set selection
      setSelected(selectedValue);
      handleMenuClick();
    };

    const { key } = event;
    switch (key) {
      case 'ArrowUp':
        event.preventDefault();
        selectNext('up');
        break;
      case 'ArrowDown':
        event.preventDefault();
        selectNext('down');
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        commitSelectedValue();
        break;
      case 'Escape':
        handleMenuClick();
        break;
      default:
        return null;
    }

    return null;
  };

  const setMenuPosition = () => {
    const menuListElement = selectorContainerElement.querySelector('.styled-select__list');
    const activeItemElement = menuListElement.querySelector('.styled-select__list-item--active');

    let menuPosition = 0;

    if (activeItemElement) {
      // reset the menu for calculations
      menuListElement.style.top = '0px';

      const menuOffset = menuListElement.getBoundingClientRect().top;
      const itemOffset = activeItemElement.getBoundingClientRect().top;

      // calculate distance between menu top and item top
      const offsetDiff = itemOffset - menuOffset;

      // if moving the menu up will take it off the screen, use a
      // pre-baked position; otherwise move the menu up
      if ((menuOffset - offsetDiff) < 0) {
        menuPosition = -4;
      } else {
        menuPosition = -(offsetDiff);
      }
    }

    // set the menu position
    menuListElement.style.top = `${menuPosition}px`;
  };

  onMount(async () => {
    setSelected();
  });

  afterUpdate(() => {
    if (isMenuOpen) {
      setMenuPosition();
    } else {
      setSelected();
    }
  });
</script>

<style>
  /* components/figma-select-menu */
</style>

<svelte:window on:keydown={watchKeys} bind:scrollY={scrollY}/>
<svelte:body on:click={handleClickOutside}/>

<span
  class={className}
  bind:this={selectorContainerElement}
>
  <div
    bind:this={fauxSelectorElement}
    class="styled-select"
  >
    <button
      class={`styled-select__button${isMenuOpen ? ' styled-select__button--active' : ''}`}
      disabled={disabled}
      on:click={() => handleMenuClick()}
    >
      <span class="styled-select__button-label">
        {selected.text}
      </span>
      <span class="styled-select__icon"></span>
    </button>
    <ul
      class={`styled-select__list${isMenuOpen ? ' styled-select__list--active' : ''}`}
      style="top: 0px"
    >
      {#each options as option (option.value)}
        {#if (option.value && !option.value.includes('divider--'))}
          <li
            class={`styled-select__list-item${isSelected(option.value, selected, value) ? ' styled-select__list-item--active' : ''}${option.disabled ? ' styled-select__list-item--disabled' : ''}`}
            data-value={option.value}
            on:click={() => handleItemClick(option.value)}
          >
            <span class="styled-select__list-item-icon"></span>
            <span class={`styled-select__list-item-text${option.value === 'blank--value' ? ' is-blank' : ''}${option.disabled ? ' styled-select__list-item-text--disabled' : ''}`}>
              {option.text}
            </span>
          </li>
        {:else if option.value.includes('divider--')}
          <div class="styled-select__divider">
            <span class="styled-select__divider-line"></span>
          </div>
        {/if}
      {/each}

    </ul>
  </div>
  <select
    bind:value={value}
    class="styled-select select-menu"
    disabled={disabled}
    id={nameId}
    style="display:none"
  >
    {#each options as option (option.value)}
      <option
        disabled={option.disabled}
        selected={isSelected(option.value, selected, value)}
        value={option.value}
      >
        {option.text}
      </option>
    {/each}
  </select>
</span>
