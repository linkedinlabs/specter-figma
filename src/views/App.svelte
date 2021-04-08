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
  import SpecSelector from './SpecSelector';

  export let isInternal = false;
  export let isMercadoMode = false;
  export let isUserInput = false;
  export let isInfoPanel = false;
  export let specPages = [];
  export let items;
  export let newSessionKey = null;
  export let userInputValue = null;
  export let viewContext = null;

  let bodyHeight = 0;
  let wasBodyHeight = 0;
  let showSelector = false;

  const handleSelectorAction = (action) => {
    if (action === 'show-selector') {
      showSelector = true;
    } else if (action === 'close') {
      showSelector = false;
    }
  };

  const handleAction = (action) => {
    if (action === 'show-selector' || showSelector) {
      handleSelectorAction(action);
    } else {
      parent.postMessage({
        pluginMessage: {
          action,
        },
      }, '*');
    }
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
  {#if $viewContextStored && !isInfoPanel && !isUserInput && !showSelector}
  <SceneNavigator currentView={$viewContextStored}/>
  {/if}

  <div class={`container${isUserInput ? ' wide' : ''}`}>
    <div class="transition-mask"></div>

    {#if !isUserInput && !showSelector}
      <ButtonInfoTrigger
        on:handleAction={customEvent => handleAction(customEvent.detail)}
        isInfoPanel={isInfoPanel}
      />
    {/if}

    {#if !isUserInput && !isInfoPanel && !showSelector}
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

    {#if showSelector}
      <SpecSelector
        on:handleAction={customEvent => handleAction(customEvent.detail)}
        specPages={specPages}
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
