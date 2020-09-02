<script>
  import { afterUpdate, createEventDispatcher } from 'svelte';

  export let userInputValue = null;

  const dispatch = createEventDispatcher();
  let inputElement = null;
  let originalValue = userInputValue;

  const initialSelect = () => {
    inputElement.focus();
    inputElement.select();
  };

  const submitValue = () => {
    const currentValue = inputElement.value;

    // bubble action to main
    parent.postMessage({
      pluginMessage: {
        inputType: 'submit',
        inputValue: currentValue,
      },
    }, '*');
  };

  const watchKeys = (event) => {
    const { key } = event;

    if ((key === 'Enter') || (key === 'NumpadEnter')) {
      submitValue();
    }

    if (key === 'Escape') {
      dispatch('handleAction', 'cancel');
    }
  };

  afterUpdate(async () => {
    if (userInputValue && !originalValue) {
      originalValue = userInputValue;
    }

    if (originalValue) {
      initialSelect();
    }
  });
</script>

<section
  on:keyup={watchKeys}
  class="user.input"
>
  <h3>
    Set the annotation’s text…
  </h3>
  <p>
    <input
      bind:this={inputElement}
      class="input"
      placeholder="Write something…"
      type="text"
      value={userInputValue}
    >
  </p>
  <p class="form-actions">
    <button
      on:click={() => dispatch('handleAction', 'cancel')}
      class="button button--secondary button--margin-right"
    >
      Cancel
    </button>
    <button
      on:click={() => submitValue()}
      class="button button--primary"
    >
      Set
    </button>
  </p>
</section>
