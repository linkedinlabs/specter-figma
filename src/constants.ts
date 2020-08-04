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
 * @description An object containing the current string constants used as keys in plugin data.
 * Changing one of these keys will break data retrieval or reset data in any
 * `xPluginData` getters/setters and potentially elsewhere.
 *
 * @kind constant
 * @name DATA_KEYS
 * @type {Object}
 */
const DATA_KEYS = {
  options: `${PLUGIN_IDENTIFIER}.options-001`,
};

/**
 * @description An object containing the set of colors in-use by the plugin.
 *
 * @kind constant
 * @name COLORS
 * @type {Object}
 */
const COLORS = {
  component: '#6255ca',
  custom: '#c8006a',
  dimension: '#4c7100',
  spacing: '#007373',
  style: '#bc3600',
};

/**
 * @description A matrix for converting spacing numbers into Mercado-style tokens.
 *
 * @kind constant
 * @name SPACING_MATRIX
 * @type {Array}
 */
const SPACING_MATRIX: Array<{
  unit: number,
  token: string,
}> = [
  {
    unit: 4,
    token: 'spacing-half-x',
  },
  {
    unit: 8,
    token: 'spacing-one-x',
  },
  {
    unit: 12,
    token: 'spacing-one-and-a-half-x',
  },
  {
    unit: 16,
    token: 'spacing-two-x',
  },
  {
    unit: 24,
    token: 'spacing-three-x',
  },
  {
    unit: 32,
    token: 'spacing-four-x',
  },
  {
    unit: 48,
    token: 'spacing-six-x',
  },
  {
    unit: 64,
    token: 'spacing-eight-x',
  },
  {
    unit: 96,
    token: 'spacing-twelve-x',
  },
];

/**
 * @description An array containing the possible typefaces to use for annotations.
 * Place the highest-priority typefaces first. Typefaces will be checked for availability
 * and loaded top-down.
 *
 * @kind constant
 * @name TYPEFACES
 * @type {Array}
 */
const TYPEFACES: Array<FontName> = [
  {
    family: 'Inconsolata',
    style: 'Bold',
  },
  {
    family: 'Helvetica Neue',
    style: 'Regular',
  },
  {
    family: 'Inter',
    style: 'Regular',
  },
  {
    family: 'Roboto',
    style: 'Regular',
  },
  {
    family: 'Verdana',
    style: 'Regular',
  },
];

/**
 * @description An object containing the current string constants the Figma API returns for
 * top-level (`main`) layer and `group` layer types.
 *
 * @kind constant
 * @name CONTAINER_NODE_TYPES
 * @type {Object}
 */
const CONTAINER_NODE_TYPES = {
  component: 'COMPONENT',
  frame: 'FRAME',
  group: 'GROUP',
  instance: 'INSTANCE',
  mask: 'BOOLEAN_OPERATION',
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
    height: 132,
  },
  input: {
    width: 440,
    height: 152,
  },
  info: {
    width: 200,
    height: 324,
  },
  mercadoDefault: {
    width: 140,
    height: 155,
  },
};

export {
  COLORS,
  CONTAINER_NODE_TYPES,
  DATA_KEYS,
  GUI_SETTINGS,
  PLUGIN_IDENTIFIER,
  PLUGIN_NAME,
  SPACING_MATRIX,
  TYPEFACES,
};
/* eslint-enable import/prefer-default-export */
