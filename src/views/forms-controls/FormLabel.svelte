<script>
  export let hide = false;
  export let isDirty = false;
  export let labelText = null;
  export let nameId = null;
</script>

<style>
  /* components/form-elements > @form-label */
</style>

<span class:hidden={hide} class={`form-label${isDirty ? ' dirty' : ''}`}>
  <span class="text">
    <label for={nameId}>{@html labelText}</label>
  </span>
</span>
