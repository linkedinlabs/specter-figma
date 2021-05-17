<script>
import ButtonOpenClose from "./ButtonOpenClose.svelte";

  export let name;

  let isOpen = false;

</script>

<style>
  .expand-collapse-container {
    color: #F0F0F0;
  }

  .expand-collapse-btn {
    background: none;
    border: none;
    color: blue;
  }

  .icon {
    fill: black;
    opacity: .8;
    /* font-size: 14px; */
  }
</style>

<div class="expand-collapse-container">
    <button class="expand-collapse-btn" on:click={() => isOpen = !isOpen}>
      {name}
      <!-- <button
  class={`item-toggle action-open-close${isOpen ? ' open' : ''}`}
  on:click={() => isOpen = !isOpen}
>
  <span class="text">
    {`${isOpen ? 'Close' : 'Open'} item`}
  </span>
  <span class="icon">
    <svg viewBox="0 0 16 16">
      <path d="M8 10L11 6L5 6L8 10Z"/>
    </svg>
  </span>
</button> -->
      {#if isOpen}
        <svg class="icon caret-down" role="img" viewBox="0 0 100 100"><path d="M31.3 192h257.3c17.8 0 26.7 21.5 14.1 34.1L174.1 354.8c-7.8 7.8-20.5 7.8-28.3 0L17.2 226.1C4.6 213.5 13.5 192 31.3 192z"></path></svg>
      {:else}
        <svg class="icon caret-right" role="img" viewBox="0 0 100 100"><path d="M0 384.662V127.338c0-17.818 21.543-26.741 34.142-14.142l128.662 128.662c7.81 7.81 7.81 20.474 0 28.284L34.142 398.804C21.543 411.404 0 402.48 0 384.662z"></path></svg>
      {/if}
    </button>
    {#if isOpen}
      hello
    {/if}
</div>
