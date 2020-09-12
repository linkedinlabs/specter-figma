<script>
  import { currentTask } from './stores';

  const menuItems = [
    {
      text: 'General',
      id: 'genera',
    },
    {
      text: 'Keyboard',
      id: 'a11y-keyboard',
    },
    {
      text: 'Labels',
      id: 'a11y-labels',
    },
    {
      text: 'Headings',
      id: 'a11y-headings',
    },
  ];

  // const setCurrentFilters = (newIsStyles, newFilter) => {
  //   parent.postMessage({
  //     pluginMessage: {
  //       action: 'setFilters',
  //       payload: {
  //         newIsSelection: $isSelection,
  //         newIsStyles,
  //         newFilter,
  //       },
  //     },
  //   }, '*');
  // };

  const handleItemClick = (selectedId) => {
    console.log(`item clicked: ${selectedId}`); // eslint-disable-line no-console
    // setCurrentFilters($isStyles, selectedId);
  };
</script>

<style>
  /* components/scene-navigator */
</style>

<nav class="scene-navigator components">
  <ul>
    {#each menuItems as item, i}
    <li>
      <button
        class:selected="{item.id === $currentTask}"
        on:click={() => handleItemClick(item.id)}
      >
        {item.text}
      </button>
    </li>
    {/each}
  </ul>
</nav>
