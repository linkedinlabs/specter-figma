<script>
  import { createEventDispatcher } from "svelte";
  import ButtonOpenClose from "./ButtonOpenClose.svelte";

  export let name;

  const dispatch = createEventDispatcher();
  let isOpen = false;

  const toggleState = () => {
    const newVal = !isOpen;
    isOpen = newVal;
    dispatch('handleClick', newVal);
  }

</script>

<style>
  .expand-collapse-container {
    color: #F0F0F0;
    width: calc(100% + 30px);
    margin-left: -15px;
    margin-top: 10px;
    background: #F0F0F0;
    border-top: 1px solid #DFDFDF;
    border-bottom: 1px solid #DFDFDF;
  }

  .expand-collapse-content {
    padding: 0 15px 10px 30px;
  }

  .expand-collapse-header {
    display: flex;
    align-items: center;
    color: rgb(113, 113, 113);
    cursor: pointer;
    padding: 0px 12px;
  }

  .isOpen {
    font-weight: 600;
  }
</style>

<div class="expand-collapse-container advanced-caret">
  <div class="expand-collapse-header" on:click={() => toggleState()}>
    <ButtonOpenClose isOpen={isOpen}/>
    <span class:isOpen>{name}</span>
  </div>
  {#if isOpen}
  <div class="expand-collapse-content">
    <slot></slot>
  </div>
  {/if}
</div>
