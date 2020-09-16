<script>
  import { beforeUpdate } from 'svelte';
  import { isMercadoStored, viewContextStored } from './stores';
  import ButtonInfoTrigger from './ButtonInfoTrigger';
  import FontPreload from './FontPreload';
  import SceneNavigator from './SceneNavigator';
  import InfoPanel from './InfoPanel';
  import MainPanel from './MainPanel';
  import UserInput from './UserInput';

  export let isInternal = false;
  export let isMercadoMode = false;
  export let isUserInput = false;
  export let isInfoPanel = false;
  export let userInputValue = null;
  export let viewContext = 'general';

  const handleAction = (action) => {
    parent.postMessage({
      pluginMessage: {
        navType: action,
      },
    }, '*');
  };

  const setIsMercadoMode = (currentIsMercadoMode) => {
    const newIsMercadoMode = currentIsMercadoMode;
    isMercadoStored.set(newIsMercadoMode);
  };

  const setViewContext = (currentViewContext) => {
    const newViewContext = currentViewContext;
    viewContextStored.set(newViewContext);
  };

  beforeUpdate(() => {
    setIsMercadoMode(isMercadoMode);
    setViewContext(viewContext);
  });
</script>

<!-- compile options -->
<svelte:options accessors={true}/>

<!-- core layout -->
<FontPreload/>
{#if !isInfoPanel && !isUserInput}
<SceneNavigator currentView={$viewContextStored}/>
{/if}

<div class={`container${isUserInput ? ' wide' : ''}`}>
  <div class="transition-mask"></div>

  {#if !isUserInput && !isInfoPanel}
    <ButtonInfoTrigger on:handleAction={customEvent => handleAction(customEvent.detail)} />

    {#if $viewContextStored === 'general'}
      <MainPanel
        on:handleAction={customEvent => handleAction(customEvent.detail)}
        showMercadoMode={$isMercadoStored}
      />
    {/if}
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
