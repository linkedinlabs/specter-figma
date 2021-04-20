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
  .user-input {
    padding: 4px 8px;
    margin: 2px 8px 0 8px;
    align-items: flex-start;
    width: 95.75%;
  }
  .list {
    display: flex;
    flex-direction: column;
    padding-left: 8px;
    font-size: 12px;
  }
  .opt-wrapper {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    cursor: pointer;
  }
  label.selected {
    font-weight: 600;
  }
  input[type="radio"] {
    position: relative;
    width: 18px;
    height: 18px;
    vertical-align: bottom;
    margin-right: 8px;
  }
  input[type="radio"]:checked:before {
    border: 3px solid #111;
  }
  /* The "background" - white background with gray border. */
  input[type="radio"]:before {
    position: absolute;
    top: -2px;
    left: -2px;
    content: "";
    display: block;
    width: 15px;
    height: 15px;
    border: 3px solid #fff;
    border-radius: 4px;
    background-color: #fff;
  }
  /* The "foreground" - color "square". */
  input[type="radio"]:after {
    position: absolute;
    top: 0;
    left: 0;
    content: "";
    display: block;
    width: 17px;
    height: 17px;
    border-radius: 2px;
  }
  input[type="radio"][value="#6255ca"]:after {
    background: #6255ca;
  }
  input[type="radio"][value="#c8006a"]:after {
    background: #c8006a;
  }
  input[type="radio"][value="#4c7100"]:after {
    background: #4c7100;
  }
  input[type="radio"][value="#0066bf"]:after {
    background: #0066bf;
  }
  input[type="radio"][value="#bc3600"]:after {
    background: #bc3600;
  }
  input[type="radio"][value="#007373"]:after {
    background: #007373;
  }
  input[type="radio"][value="#4c934f"]:after {
    background: #4c934f;
  }
</style>

<section
  on:keyup={watchKeys}
  class="user-input"
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
