<script>
  import { createEventDispatcher } from 'svelte';
  import { getStopTypeFromView } from '../../utils/tools';
  import ButtonAction from './ButtonAction';

  const dispatch = createEventDispatcher();

  export let disabled = true;
  export let number = null;
  export let type = null;

  const addStopAnnotation = () => {
    const stopType = getStopTypeFromView(type);

    parent.postMessage({
      pluginMessage: {
        action: 'a11y-add-stop',
        payload: {
          type: stopType,
        },
      },
    }, '*');

    dispatch('handleAction', 'start-loading');
  };

  const setTextLabel = (currentType) => {
    let textLabel = '';
    switch (currentType) {
      case 'a11y-headings':
        textLabel = 'heading';
        break;
      case 'a11y-keyboard':
        textLabel = 'keystop';
        break;
      case 'a11y-labels':
        textLabel = 'label';
        break;
      case 'a11y-misc':
        textLabel = 'misc';
        break;
      default:
        textLabel = '';
    }

    return textLabel;
  };
</script>

<ButtonAction
  on:handleAction={() => addStopAnnotation()}
  action="corners"
  className={`add-stop ${type}`}
  disabled={disabled}
  isReversed={true}
  text={`Add${number > 1 ? ` ${number}` : ''} ${setTextLabel(type)} annotation${number > 1 ? 's' : ''}…`}
>
  <svg viewBox="0 0 32 32">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M15.5 15.5V10.5H16.5V15.5H21.5V16.5H16.5V21.5H15.5V16.5H10.5V15.5H15.5Z"/>
  </svg>
</ButtonAction>
