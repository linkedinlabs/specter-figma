<script>
  import { createEventDispatcher } from 'svelte';
  import ButtonOpenClose from './ButtonOpenClose';

  export let name;

  const dispatch = createEventDispatcher();
  let isOpen = false;

  const toggleState = () => {
    const newVal = !isOpen;
    isOpen = newVal;
    dispatch('handleClick', newVal);
  };

</script>

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
