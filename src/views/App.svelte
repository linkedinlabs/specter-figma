<script>
  import { afterUpdate } from 'svelte';
  import { isMercadoStored } from './stores';
  import ButtonInfoTrigger from './ButtonInfoTrigger';
  import FontPreload from './FontPreload';
  import InfoPanel from './InfoPanel';
  import MainPanel from './MainPanel';
  import UserInput from './UserInput';

  export let isMercadoMode = false;
  export let isInternal = false;
  export let isUserInput = false;
  export let isInfoPanel = false;
  export let userInputValue = null;

  const setIsMercadoMode = (currentIsMercadoMode) => {
    const newIsMercadoMode = currentIsMercadoMode;
    isMercadoStored.set(newIsMercadoMode);
  };

  const handleAction = (action) => {
    parent.postMessage({
      pluginMessage: {
        navType: action,
      },
    }, '*');
  };

  afterUpdate(() => {
    setIsMercadoMode(isMercadoMode);
  });
</script>

<!-- compile options -->
<svelte:options accessors={true}/>

<!-- core layout -->
<FontPreload/>
<div class={`container${isUserInput ? ' wide' : ''}`}>
  <div class="transition-mask"></div>

  {#if !isUserInput && !isInfoPanel}
    <ButtonInfoTrigger on:handleAction={customEvent => handleAction(customEvent.detail)} />
    <MainPanel
      on:handleAction={customEvent => handleAction(customEvent.detail)}
      showMercadoMode={$isMercadoStored}
    />
  {/if}

  {#if isUserInput}
    <UserInput
      on:handleAction={customEvent => handleAction(customEvent.detail)}
      userInputValue={userInputValue}
    />
  {/if}

  {#if isInfoPanel}
    <InfoPanel
      on:handleAction={customEvent => handleAction(customEvent.detail)}
      isInternal={isInternal}
    />
  {/if}
</div>
