declare global {
  // Internal Declarations
  type PluginOptions = {
    currentView: 'general' | 'a11y-keyboard' | 'a11y-labels' | 'a11y-headings',
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
