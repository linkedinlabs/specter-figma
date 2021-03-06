<script>
  import { afterUpdate, beforeUpdate } from 'svelte';
  import spinner from '../assets/images/spinner.gif';
  import {
    isMercadoStored,
    viewContextStored,
    sessionKey,
  } from './stores';
  import AccessibilityBase from './AccessibilityBase';
  import InfoPanel from './InfoPanel';
  import FooterBar from './FooterBar';
  import FontPreload from './FontPreload';
  import GeneralPanel from './GeneralPanel/GeneralPanel';
  import SceneNavigator from './SceneNavigator';
  import UserInput from './GeneralPanel/UserInput';
  import SpecSelector from './GeneralPanel/SpecSelector';
  import ColorOrientationSelector from './GeneralPanel/ColorOrientationSelector';

  export let isInternal = false;
  export let isMercadoMode = false;
  export let isUserInput = false;
  export let isInfoPanel = false;
  export let specPages = [];
  export let lockedAnnotations = true;
  export let items;
  export let newSessionKey = null;
  export let userInputValue = null;
  export let viewContext = null;
  export let loading = true;

  let bodyHeight = 0;
  let wasBodyHeight = 0;
  let inputPage = null;

  const showHideInputScreen = (action) => {
    if (action.includes('show-')) {
      inputPage = action;
    } else if (action === 'close') {
      inputPage = null;
    }
  };

  const handleAction = (action) => {
    if (action.includes('show-') || inputPage) {
      showHideInputScreen(action);
    } else if (action === 'start-loading') {
      loading = true;
    } else {
      loading = true;
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
      // && !isUserInput
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
  {#if $viewContextStored && !isInfoPanel && !isUserInput && !inputPage}
  <SceneNavigator 
    currentView={$viewContextStored} 
    on:handleAction={customEvent => handleAction(customEvent.detail)}
  />
  {/if}

  <div class={`container${isUserInput ? ' wide' : ''}${inputPage ? ' no-footer' : ''}`}>
    <div class="transition-mask"></div>

    {#if !isUserInput && !inputPage}
      <FooterBar
        on:handleAction={customEvent => handleAction(customEvent.detail)}
        isInfoPanel={isInfoPanel}
        lockedAnnotations={lockedAnnotations}
      />
    {/if}

    {#if loading}
    <div class="overlay">
      <img class="spinner" src={spinner} alt="Action loading"/>
    </div>
    {/if}

    {#if !isUserInput && !isInfoPanel && !inputPage}
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

    {#if inputPage === 'show-page-input'}
      <SpecSelector
        on:handleAction={customEvent => handleAction(customEvent.detail)}
        specPages={specPages}
      />
    {/if}

    {#if inputPage === 'show-adjust-input'}
      <ColorOrientationSelector
        on:handleAction={customEvent => handleAction(customEvent.detail)}
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
