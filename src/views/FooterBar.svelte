<script>
  import { createEventDispatcher } from 'svelte';
  import FigmaSwitch from './forms-controls/FigmaSwitch';

  export let isInfoPanel = false;
  export let lockedAnnotations = true;

  const dispatch = createEventDispatcher();

  const handleInfoClick = (infoIsOpen) => {
    const dispatchAction = infoIsOpen ? 'info-hide' : 'info';
    dispatch('handleAction', dispatchAction);
  };

  const handleLockClick = () => {
    dispatch('handleAction', 'lock');
  };
</script>

<style>

</style>

<div
  class={`footer-bar${isInfoPanel ? ' info-open' : ''}`}
>
  <FigmaSwitch
    className="form-element element-type-switch inverted"
    labelText="Lock annotations"
    value={lockedAnnotations}
    on:click={() => handleLockClick()}
  />
  <button class="info-icon" aria-label="Specter info" on:click={() => handleInfoClick(isInfoPanel)}>
    <svg width="16" height="16" viewBox="0 0 16 16" class="question-circle" fill="none">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16ZM8.19678 9.75H7.25928V9.70312C7.271 8.21484 7.72803 7.76172 8.49365 7.29688C8.95068 7.01953 9.30615 6.57422 9.30615 5.95312C9.30615 5.1875 8.7124 4.70312 7.97803 4.70312C7.3374 4.70312 6.69287 5.07813 6.63428 6H5.6499C5.7085 4.67188 6.7124 3.89062 7.97803 3.89062C9.35303 3.89062 10.2437 4.78125 10.2437 6C10.2437 6.86328 9.8374 7.46484 9.1499 7.88281C8.4624 8.3125 8.2124 8.73438 8.19678 9.70312V9.75ZM8.4624 11.3594C8.4624 11.7461 8.146 12.0625 7.75928 12.0625C7.37256 12.0625 7.05615 11.7461 7.05615 11.3594C7.05615 10.9727 7.37256 10.6562 7.75928 10.6562C8.146 10.6562 8.4624 10.9727 8.4624 11.3594Z" fill="white"/>
    </svg>      
    <span class="text">Specter Info { isInfoPanel }</span>
  </button>
</div>
