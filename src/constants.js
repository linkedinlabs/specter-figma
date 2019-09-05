/* eslint-disable import/prefer-default-export */

/**
 * @description A unique string to identify the plugin within Figma.
 * Changing this will break data retrieval in any `sharedPluginData` and potentially elsewhere.
 * [More info]{@link https://www.figma.com/plugin-docs/api/properties/nodes-setsharedplugindata/}
 *
 * @kind constant
 * @name PLUGIN_IDENTIFIER
 * @type {string}
 */
const PLUGIN_IDENTIFIER = 'com.linkedin.figma.specter-plugin';

/**
 * @description The public-facing name for the plugin. This should match the
 * `name` stated in manifset.json.
 *
 * @kind constant
 * @name PLUGIN_NAME
 * @type {string}
 */
const PLUGIN_NAME = 'Specter';

const COLORS = {
  component: '#9966ff',
  custom: '#ff3399',
  dimension: '#99cc00',
  spacing: '#00cc99',
  style: '#ff6655',
};

const GUI_SETTINGS = {
  default: {
    width: 140,
    height: 180,
  },
};

const CLOSE_PLUGIN_MSG = '_CLOSE_PLUGIN_';

export {
  CLOSE_PLUGIN_MSG,
  COLORS,
  GUI_SETTINGS,
  PLUGIN_IDENTIFIER,
  PLUGIN_NAME,
};
/* eslint-enable import/prefer-default-export */
