<script>
  // import { afterUpdate, beforeUpdate } from 'svelte';
  // import {
  //   currentFilter,
  //   isSelection,
  //   isStyles,
  //   sessionKey,
  // } from './stores';
  import FontPreload from './FontPreload';

  export const isMercadoMode = false;

  let bodyHeight = 0;
  let wasBodyHeight = 0;

  // const setIsStyles = (currentlyInspecting) => {
  //   const newIsStyles = currentlyInspecting === 'styles';
  //   isStyles.set(newIsStyles);
  // };

  // beforeUpdate(() => {
  //   setIsStyles(inspect);
  // });
</script>

<!-- compile options -->
<svelte:options accessors={true}/>

<!-- core layout -->
<div>
  <FontPreload/>
  <p>hello</p>
</div>
