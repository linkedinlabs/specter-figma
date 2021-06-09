<script>
  import { createEventDispatcher } from 'svelte';
  import { COLORS } from '../../constants';

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
  /* components/color-selector */
  .annotation-icon:hover {
    fill: blue;
  }
</style>

<section
  on:keyup={watchKeys}
  class="user-input color-selector"
>
  <div class="content-wrapper">
    <p class="instructions">
      Pointer changes apply to all selected annotations, and relocate a11y annotations. Color changes apply to general annotations.
    </p>
    <div class="options-wrapper">
      <div class="color-list">
        {#each colorOptions as opt} 
          <label class:selected="{opt.hex === color}" class='swatch-wrapper' >
            <input type="radio" bind:group={color} value={opt.hex} on:click={() => handleClick('color', opt.hex)} />{opt.label}
          </label>
        {/each}
      </div>   
      <div class="orientation-grid">
        <button
          class="orientation-btn up-btn"
          on:click={() => handleClick('orientation', 'up')}
        >
          <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path class="annotation-icon" d="M2.28571 14.4444H9.33714L12.0686 17.0222L15.3143 14.4444H21.7143V2.22222H2.28571V14.4444ZM0 0H24V16.6667H16.1257L11.9429 20L8.41143 16.6667H0V0Z" fill="black"/>
          </svg>
        </button>
        <button
          class="orientation-btn left-btn"
          class:selected={orientation === 'left'}
          on:click={() => handleClick('orientation', 'left')}
        >
          <svg width="27" height="20" viewBox="0 0 27 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path class="annotation-icon" fill-rule="evenodd" clip-rule="evenodd" d="M23.667 6V0H0V20H23.667V14L27 10L23.667 6ZM24.1364 10L21.467 6.79645V2.2H2.2V17.8H21.467V13.2036L24.1364 10Z" fill="black"/>
          </svg>
        </button>
        <div class="center-design">
          <svg width="22" height="18" viewBox="0 0 22 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M2 0H0V2H2V0ZM18 0H16V2H18V0ZM4 1H5V2H4V1ZM2 4H1V5H2V4ZM16 4H17V5H16V4ZM2 6.5H1V7.5H2V6.5ZM16 6.5H17V7.5H16V6.5ZM2 9H1V10H2V9ZM16 9H17V10H16V9ZM5 12H4V13H5V12ZM7 1H8V2H7V1ZM8 12H7V13H8V12ZM10 1H11V2H10V1ZM11 12H10V13H11V12ZM13 1H14V2H13V1ZM14 12H13V13H14V12ZM2 12V14H0V12H2ZM18 12H16V14H18V12Z" fill="#18A0FB"/>
          </svg>          
        </div>
        <button
          class="orientation-btn right-btn"
          on:click={() => handleClick('orientation', 'right')}
        >
          <svg width="27" height="20" viewBox="0 0 27 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path class="annotation-icon" fill-rule="evenodd" clip-rule="evenodd" d="M5.533 6.79645L2.86364 10L5.533 13.2036V17.8H24.8V2.2H5.533V6.79645ZM3.333 0H27V20H3.333V14L0 10L3.333 6V0Z" fill="black"/>
          </svg>
        </button>
        <button
          class="orientation-btn down-btn"
          on:click={() => handleClick('orientation', 'down')}
        >
          <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path class="annotation-icon"  d="M2.28571 5.55556H9.33714L12.0686 2.97778L15.3143 5.55556H21.7143V17.7778H2.28571V5.55556ZM0 20H24V3.33333H16.1257L11.9429 0L8.41143 3.33333H0V20Z" fill="black"/>
          </svg>        
        </button>
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
