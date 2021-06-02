<script>
  import { createEventDispatcher } from 'svelte';
  import { COLORS } from '../../constants';

  const dispatch = createEventDispatcher();
  
  let value = null;

  const options = Object.entries(COLORS).reduce((acc, color) => {
    const [label, hex] = color;
    if (!acc.map(item => item.hex).includes(hex)) {
      acc.push({ hex, label });
    } else {
      const index = acc.findIndex(item => item.hex === hex);
      acc[index].label += ` / ${label}`;
    }
    return acc;
  }, []);

  const submitValue = () => {
    parent.postMessage({
      pluginMessage: {
        action: 'color',
        payload: {
          color: value,
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
</style>

<section
  on:keyup={watchKeys}
  class="user-input color-selector"
>
  <h3>
    Choose color for selected annotations…
  </h3>
  
  <div class="list">
    {#each options as opt} 
    <label class:selected="{opt.hex === value}" class='opt-wrapper' >
      <input type="radio" bind:group={value} value={opt.hex}/>{opt.label}
    </label>
    {/each}
  </div>   
  <p class="form-actions">
    <button
      on:click={() => dispatch('handleAction', 'close')}
      class="button button--secondary button--margin-right"
    >
      Cancel
    </button>
    <button
      on:click={() => submitValue()}
      class="button button--primary"
    >
      OK
    </button>
  </p>
</section>
