declare global {
  // Internal Declarations
  type PluginViewTypes = 'general' | 'a11y-keyboard' | 'a11y-labels' | 'a11y-headings';

  type PluginKeystopKeys = 'arrows-left-right' | 'arrows-up-down' | 'enter' | 'escape' | 'space';

  type PluginAriaRole = 'no-role' | 'image' | 'image-decorative' | 'button' | 'checkbox' | 'link' | 'menuitem' | 'menuitemcheckbox' | 'menuitemradio' | 'options' | 'progressbar' | 'searchbox' | 'radio' | 'slider' | 'switch' | 'tab' | 'tabpanel' | 'textbox' | 'combobox' | 'listbox' | 'menu' | 'radiogroup' | 'tablist';

  type PluginStopType = 'keystop' | 'label' | 'heading';

  type PluginAriaLabels = {
    a11y: string,
    visible: boolean,
    alt: string,
  }

  type PluginAriaHeading = {
    level: string,
    visible: boolean,
    invisible: string
  }

  type PluginNodePosition = {
    frameWidth: number,
    frameHeight: number,
    width: number,
    height: number,
    x: number,
    y: number,
  };

  type PluginFramePosition = {
    width: number,
    height: number,
    x: number,
    y: number,
  };

  type PluginNodeTrackingData = {
    id: string, // ID of node containing the design element
    annotationId: string, // ID of node containing the annotation itself
    legendItemId?: string, // ID of node containing the legend entry
    linkId: string,  // shared link between the above 2 (cus those may change via Figma)
    topFrameId: string,
    nodePosition: PluginNodePosition,
  };

  type PluginFrameTrackingData = {
    id: string,
    legendId?: string,
    linkId: string,
    framePosition: PluginFramePosition,
  };

  type PluginStopListData = {
    id: string,
    position: number,
  }
  
  type PluginNodeLinkData = {
    id: string,
    role: 'annotation' | 'node' | 'legendItem',
  }
  
  type PluginFrameLinkData = {
    id: string,
    role: 'frame' | 'legend',
  }

  type PluginOptions = {
    currentView: PluginViewTypes,
    isInfo: boolean,
    isMercadoMode: boolean,
  };

  type PluginViewObject = {
    hasStop: boolean,
    id: string,
    isSelected: boolean,
    keys?: Array<PluginKeystopKeys>,
    role?: PluginAriaRole,
    labels?: PluginAriaLabels,
    heading?: PluginAriaHeading,
    name: string,
    position: number | string,
  }

  // Vendor Declarations

  // for attaching Svelte to window global
  interface Window {
    app: Function;
  }

  // Figma’s typings in npm package @figma/plugin-typings
} // declare global

export {}
