<script>
  export let currentView = 'general';

  const menuItems = [
    {
      text: 'General',
      id: 'general',
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

  const setCurrentViewContext = (newView) => {
    parent.postMessage({
      pluginMessage: {
        action: 'setViewContext',
        payload: {
          newView,
          skipDiff: true,
        },
      },
    }, '*');
  };

  const handleItemClick = (selectedId) => {
    currentView = selectedId;
    setCurrentViewContext(selectedId);
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
        class:selected="{item.id === currentView}"
        on:click={() => handleItemClick(item.id)}
      >
        {item.text}
      </button>
    </li>
    {/each}
  </ul>
</nav>
