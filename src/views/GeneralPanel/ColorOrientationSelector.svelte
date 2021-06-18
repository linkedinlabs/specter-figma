<script>
  import { createEventDispatcher } from 'svelte';
  import { COLORS } from '../../constants';
  import Icon from '../../assets/images/Icon';

  const dispatch = createEventDispatcher();

  let color = null;
  let orientation = null;

  const colorOptions = [
    { label: 'Component', hex: COLORS.component },
    { label: 'Style', hex: COLORS.style },
    { label: 'Size', hex: COLORS.dimension },
    { label: 'Spacing', hex: COLORS.spacing },
    { label: 'Custom', hex: COLORS.custom },
  ];

  const orientationOptions = [
    'left',
    'right',
    'up',
    'down',
  ];

  const handleClick = (field, value) => {
    // enables deselection to proceed without a value
    if (field === 'color' && color === value) {
      color = null;
    } else if (field === 'orientation') {
      orientation = orientation === value ? null : value;
    }
  };

  const submitValue = () => {
    parent.postMessage({
      pluginMessage: {
        action: 'edit',
        payload: {
          color,
          orientation,
        },
      },
    }, '*');

    dispatch('handleAction', 'close');
  };

  const watchKeys = (event) => {
    const { key } = event;

    if ((key === 'Enter') || (key === 'NumpadEnter')) {
      submitValue();
    }

    if (key === 'Escape') {
      dispatch('handleAction', 'close');
    }
  };

</script>

<style>
  /* components/color-orientation-selector */
</style>

<section
  on:keyup={watchKeys}
  class="user-input color-selector"
>
  <div class="content-wrapper">
    <p class="instructions">
      [Limited functionality] Change color of general annotations, or change caret orientation of any annotation.
    </p>
    <div class="options-wrapper">
      <div class="half-wrapper color">
        <h2>Select Color</h2>
        <div class="color-radios">
          {#each colorOptions as opt} 
          <div class="color-radio">
            <input type="radio" id={opt.label.toLowerCase()} name="color" bind:group={color} value={opt.hex} on:click={() => handleClick('color', opt.hex)} checked>
            <label for={opt.label.toLowerCase()}>
              <span class={opt.label.toLowerCase()}>
                <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="check" class="svg-inline--fa fa-check fa-w-16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="white" d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"></path></svg>
              </span>
              {opt.label}
            </label>
          </div>
          {/each}
        </div>   
      </div>
      <div class="half-wrapper orientation">
        <h2>Select Orientation</h2>
        <div class="orientation-radios">
          {#each orientationOptions as opt}
          <div class={`orientation-radio ${opt}`}>
            <input 
              type="radio" 
              id={`${opt}-radio`}
              name="orientation" 
              bind:group={orientation} 
              value={opt}
              on:click={() => handleClick('orientation', opt)} 
              checked
            >
            <label for={`${opt}-radio`}>
              <Icon 
                name={`orientation-${opt}`} 
                class="orientation-icon" 
                active={orientation === opt} 
                width={['left', 'right'].includes(opt) ? 36 : 35} 
                clickable={true}
                focusable={true}
                />
            </label>
          </div>
          {/each}
          <div class="center-design">
            <Icon name='center-design' width={22} height={18} />
          </div>
        </div>
      </div>
    </div>
  </div>
  <p class="form-actions">
    <button
      on:click={() => dispatch('handleAction', 'close')}
      class="button button--secondary button--margin-right"
    >
      Discard
    </button>
    <button
      on:click={() => submitValue()}
      class="button button--primary"
      disabled={!orientation && !color}
    >
      Apply
    </button>
  </p>
</section>
