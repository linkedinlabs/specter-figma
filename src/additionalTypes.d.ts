declare global {
  // Internal Declarations
  type PluginViewTypes = 'general' | 'a11y-keyboard' | 'a11y-labels' | 'a11y-headings';

  type PluginKeystopKeys = 'arrows-left-right' | 'arrows-up-down' | 'enter' | 'escape' | 'space';

  type PluginLabelRoles = 'image' | 'image-decorative' | 'button' | 'checkbox' | 'link' | 'menuitem' | 'menuitemcheckbox' | 'menuitemradio' | 'options' | 'progressbar' | 'searchbox' | 'radio' | 'slider' | 'switch' | 'tab' | 'tabpanel' | 'textbox' | 'combobox' | 'listbox' | 'menu' | 'radiogroup' | 'tablist';

  type PluginAriaLabels = {
    a11y: null,
    visible: null,
    alt: null,
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
    annotationId: string, // ID of node containing the annotation itself
    id: string, // ID of node containing the design element
    linkId: string,  // shared link between the above 2 (cus those may change via Figma)
    topFrameId: string,
    nodePosition: PluginNodePosition,
  };

  type PluginFrameTrackingData = {
    frameId: string,
    id: string,
    linkId: string,
    framePosition: PluginFramePosition,
  };

  type PluginNodeLinkData = {
    id: string,
    role: 'annotation' | 'node',
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
    labels?: PluginAriaLabels,
    name: string,
    position: number | string,
    role?: string,
  }

  // Vendor Declarations

  // for attaching Svelte to window global
  interface Window {
    app: Function;
  }

  // Figma’s typings in npm package @figma/plugin-typings
} // declare global

export {}
