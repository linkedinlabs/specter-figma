<script>
  import { createEventDispatcher } from 'svelte';

  import ButtonAction from './ButtonAction';

  // props
  export let disabled = true;
  export let number = null;
  export let type = null;

  const dispatch = createEventDispatcher();
</script>

<ButtonAction
  on:handleAction={() => dispatch('handleAction', `${type}-add-stop`)}
  action="corners"
  className="add-stop"
  disabled={disabled}
  isReversed={true}
  text={`Add${number > 1 ? ` ${number}` : ''} focus stop${number > 1 ? 's' : ''}…`}
>
  <svg viewBox="0 0 32 32">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M15.5 15.5V10.5H16.5V15.5H21.5V16.5H16.5V21.5H15.5V16.5H10.5V15.5H15.5Z"/>
  </svg>
</ButtonAction>
