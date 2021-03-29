<script>
  import { afterUpdate, beforeUpdate } from 'svelte';
  import {
    isMercadoStored,
    viewContextStored,
    sessionKey,
  } from './stores';
  import AccessibilityBase from './AccessibilityBase';
  import InfoPanel from './InfoPanel';
  import ButtonInfoTrigger from './forms-controls/ButtonInfoTrigger';
  import FontPreload from './FontPreload';
  import GeneralPanel from './GeneralPanel';
  import SceneNavigator from './SceneNavigator';
  import UserInput from './UserInput';

  export let isInternal = false;
  export let isMercadoMode = false;
  export let isUserInput = false;
  export let isInfoPanel = false;
  export let items;
  export let newSessionKey = null;
  export let userInputValue = null;
  export let viewContext = null;

  let bodyHeight = 0;
  let wasBodyHeight = 0;

  const handleAction = (action) => {
    parent.postMessage({
      pluginMessage: {
        action,
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
    sessionKey.set(newSessionKey);

    // resize UI height
    if (
      $viewContextStored
      && ($viewContextStored !== 'general')
      && !isUserInput
      && !isInfoPanel
      && (wasBodyHeight !== bodyHeight)
      && (items.length)
    ) {
      parent.postMessage({
        pluginMessage: {
          action: 'resize',
          payload: { bodyHeight },
        },
      }, '*');
    }
  });

  afterUpdate(() => {
    wasBodyHeight = bodyHeight;
  });
</script>

<!-- compile options -->
<svelte:options accessors={true}/>

<!-- core layout -->
<div bind:offsetHeight={bodyHeight}>
  <FontPreload/>
  {#if $viewContextStored && !isInfoPanel && !isUserInput}
  <SceneNavigator currentView={$viewContextStored}/>
  {/if}

  <div class={`container${isUserInput ? ' wide' : ''}`}>
    <div class="transition-mask"></div>

    {#if !isUserInput}
      <ButtonInfoTrigger
        on:handleAction={customEvent => handleAction(customEvent.detail)}
        isInfoPanel={isInfoPanel}
      />
    {/if}

    {#if !isUserInput && !isInfoPanel}
      {#if $viewContextStored === 'general'}
        <GeneralPanel
          on:handleAction={customEvent => handleAction(customEvent.detail)}
          showMercadoMode={$isMercadoStored}
        />
      {:else if $viewContextStored}
        <AccessibilityBase
          on:handleAction={customEvent => handleAction(customEvent.detail)}
          items={items}
          viewContext={$viewContextStored}
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
</div>
