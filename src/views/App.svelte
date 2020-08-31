<script>
  // import { afterUpdate, beforeUpdate } from 'svelte';
  // import {
  //   currentFilter,
  //   isSelection,
  //   isStyles,
  //   sessionKey,
  // } from './stores';
  import ButtonInfoTrigger from './ButtonInfoTrigger';
  import FontPreload from './FontPreload';
  import InfoPanel from './InfoPanel';
  import MainPanel from './MainPanel';
  import UserInput from './UserInput';

  export let isMercadoMode = false;
  export let isInternal = false;
  export let isUserInput = false;
  // export let isInfoPanel = false;

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
<FontPreload/>
<div class="container">
  <div class="transition-mask"></div>
  <ButtonInfoTrigger />
  <MainPanel isMercadoMode={isMercadoMode} />
  <UserInput isUserInput={isUserInput} />
  <InfoPanel isInternal={isInternal} />
</div>
