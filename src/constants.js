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

/**
 * @description An object containing the set of colors in-use by the plugin.
 *
 * @kind constant
 * @name COLORS
 * @type {Object}
 */
const COLORS = {
  component: '#9966ff',
  custom: '#ff3399',
  dimension: '#99cc00',
  spacing: '#00cc99',
  style: '#ff6655',
};

/** WIP
 * @description An object containing the set of colors in-use by the plugin.
 *
 * @kind constant
 * @name TYPEFACES
 * @type {Object}
 */
const TYPEFACES = {
  primary: {
    family: 'Helvetica Neue',
    style: 'Regular',
  },
  secondary: {
    family: 'Roboto',
    style: 'Regular',
  },
};

/**
 * @description An object containing the current string constants the Figma API returns for
 * top-level (`main`) layer and `group` layer types.
 *
 * @kind constant
 * @name FRAME_TYPES
 * @type {Object}
 */
const FRAME_TYPES = {
  main: 'FRAME',
  group: 'GROUP',
};

/**
 * @description An object containing `height`/`width` settings for the plugin GUI window.
 *
 * @kind constant
 * @name GUI_SETTINGS
 * @type {Object}
 */
const GUI_SETTINGS = {
  default: {
    width: 140,
    height: 180,
  },
};

/**
 * @description A unique message that will cause the plugin to shut-down.
 *
 * @kind constant
 * @name CLOSE_PLUGIN_MSG
 * @type {string}
 */
const CLOSE_PLUGIN_MSG = '_CLOSE_PLUGIN_';

export {
  CLOSE_PLUGIN_MSG,
  COLORS,
  FRAME_TYPES,
  GUI_SETTINGS,
  PLUGIN_IDENTIFIER,
  PLUGIN_NAME,
  TYPEFACES,
};
/* eslint-enable import/prefer-default-export */
