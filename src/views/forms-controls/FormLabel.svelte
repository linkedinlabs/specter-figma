<script>
  export let labelText = null;
  export let isDirty = false;
  export let nameId = null;
  export let value = null;
</script>

<style>
  /* components/form-elements > @form-label */
</style>

<span class={`form-label${isDirty ? ' dirty' : ''}`}>
  <span class="text">
    <label for={nameId}>{@html labelText}</label>
  </span>
</span>
