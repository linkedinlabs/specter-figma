declare global {
  // Internal Declarations
  type PluginViewTypes = 'general' | 'a11y-keyboard' | 'a11y-labels' | 'a11y-headings';

  type PluginKeystopKeys = 'arrows-left-right' | 'arrows-up-down' | 'enter' | 'escape' | 'space';

  type PluginNodePosition = {
    frameWidth: number,
    frameHeight: number,
    width: number,
    height: number,
    x: number,
    y: number,
    index: number,
  };

  type PluginNodeTrackingData = {
    annotationId: string,
    id: string,
    linkId: string,
    topFrameId: string,
    nodePosition: PluginNodePosition,
  };

  type PluginOptions = {
    currentView: PluginViewTypes,
    isMercadoMode: boolean,
  };

  // Vendor Declarations

  // for attaching Svelte to window global
  interface Window {
    app: Function;
  }

  // Figma’s typings in npm package @figma/plugin-typings
} // declare global

export {}
