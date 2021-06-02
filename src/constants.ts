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
const PLUGIN_IDENTIFIER: string = process.env.PLUGIN_IDENTIFIER || 'com.linkedin.figma.specter-plugin';

/**
 * @description The public-facing name for the plugin. This should match the
 * `name` stated in manifset.json.
 *
 * @kind constant
 * @name PLUGIN_NAME
 * @type {string}
 */
const PLUGIN_NAME: string = process.env.PLUGIN_NAME || 'Specter';

/**
 * @description An object containing the current string constants used as keys in plugin data.
 * Changing one of these keys will break data retrieval or reset data in any
 * `xPluginData` getters/setters and potentially elsewhere. The keys should be considered
 * similarly to table names in a database schema or model names.
 * * `options` – The key used for saving/retrieving plugin preferences/options. Often used in
 * managing the state of the UI across plugin sessions.
 * * `bundle` – Used for accessing the bundle of data shared between plugins on a node. For
 * example, with data shared between Stapler and Specter.
 * * `keystopNodeData` – Data directly-related to a node’s keystop annotation (i.e. position,
 * list of current keys, etc.).
 * * `keystopAnnotations` – A page-level list of all current keystop annotations in play. Used
 * for diffing changes in case we need to re-paint annotations.
 * * `keystopLinkId` – A unique identifier allowing us to find relationships between keystop nodes
 * regardless of their Figma `id`.
 * * `keystopList` – The current list of keystops appended to a top-level frame.
 * * `labelNodeData` – Data directly-related to a node’s label annotation (i.e. position,
 * list of current keys, etc.).
 * * `labelAnnotations` – A page-level list of all current label annotations in play. Used
 * for diffing changes in case we need to re-paint annotations.
 * * `labelLinkId` – A unique identifier allowing us to find relationships between label nodes
 * regardless of their Figma `id`.
 * * `labelList` – The current list of labels appended to a top-level frame.
 * * `relaunch` – A list of current Figma Relaunch Buttons appended to a node.
 *
 * @kind constant
 * @name DATA_KEYS
 * @type {Object}
 */
const DATA_KEYS: {
  options: string,
  keystopAnnotations: string,
  labelAnnotations: string,
  headingAnnotations: string,
  miscAnnotations: string,
  legendFrames: string,
  specPage: string,
  specSettings: string,
  keystopList: string,
  labelList: string,
  headingList: string,
  miscList: string,
  legendLinkId: string,
  isSpecInstance: string,
  bundle: string,
  keystopNodeData: string,
  labelNodeData: string,
  headingNodeData: string,
  miscNodeData: string,
  keystopLinkId: string,
  labelLinkId: string,
  headingLinkId: string,
  miscLinkId: string,
  relaunch: string,
} = {
  // page-level (e.g. in case an annotated element is moved out of a frame?)
  options: `${PLUGIN_IDENTIFIER}.options-001`,
  keystopAnnotations: `${PLUGIN_IDENTIFIER}.keystopAnnotations-001`,
  labelAnnotations: `${PLUGIN_IDENTIFIER}.labelAnnotations-001`,
  headingAnnotations: `${PLUGIN_IDENTIFIER}.headingAnnotations-001`,
  miscAnnotations: `${PLUGIN_IDENTIFIER}.miscAnnotations-001`,
  legendFrames: `${PLUGIN_IDENTIFIER}.legendFrames-001`,
  specPage: `${PLUGIN_IDENTIFIER}.specPage-001`,
  specSettings: `${PLUGIN_IDENTIFIER}.specSettings-001`,
  // top-frame level
  keystopList: `${PLUGIN_IDENTIFIER}.keystopList-001`,
  labelList: `${PLUGIN_IDENTIFIER}.labelList-001`,
  headingList: `${PLUGIN_IDENTIFIER}.headingList-001`,
  miscList: `${PLUGIN_IDENTIFIER}.miscList-001`,
  legendLinkId: `${PLUGIN_IDENTIFIER}.legendLinkId-001`,
  isSpecInstance: `${PLUGIN_IDENTIFIER}.isSpecInstance-001`,
  // node-level and up
  bundle: `${PLUGIN_IDENTIFIER}.bundle-001`,
  keystopNodeData: `${PLUGIN_IDENTIFIER}.keystopNodeData-001`,
  labelNodeData: `${PLUGIN_IDENTIFIER}.labelNodeData-001`,
  headingNodeData: `${PLUGIN_IDENTIFIER}.headingNodeData-001`,
  miscNodeData: `${PLUGIN_IDENTIFIER}.miscNodeData-001`,
  keystopLinkId: `${PLUGIN_IDENTIFIER}.linkId-001`, // legacy, “.linkId”
  labelLinkId: `${PLUGIN_IDENTIFIER}.labelLinkId-001`,
  headingLinkId: `${PLUGIN_IDENTIFIER}.headingLinkId-001`,
  miscLinkId: `${PLUGIN_IDENTIFIER}.miscLinkId-001`,
  relaunch: `${PLUGIN_IDENTIFIER}.relaunch-001`,
};

/**
 * @description An object containing the set of colors in-use by the plugin.
 *
 * @kind constant
 * @name COLORS
 * @type {Object}
 */
const COLORS: {
  component: string,
  custom: string,
  dimension: string,
  keystop: string,
  label: string,
  heading: string,
  spacing: string,
  style: string,
  misc: string
} = {
  component: '#6255ca',
  custom: '#c8006a',
  dimension: '#4c7100',
  keystop: '#c8006a',
  label: '#0066bf',
  heading: '#bc3600',
  spacing: '#007373',
  style: '#bc3600',
  misc: '#4c934f',
};

/**
 * @description A matrix for converting border radius numbers into Mercado-style tokens.
 *
 * @kind constant
 * @name RADIUS_MATRIX
 * @type {Array}
 */
const RADIUS_MATRIX: Array<{
  unit: number,
  token: string,
}> = [
  {
    unit: 4,
    token: 'corner-radius-small',
  },
  {
    unit: 8,
    token: 'corner-radius-medium',
  },
  {
    unit: 16,
    token: 'corner-radius-large',
  },
  {
    unit: 24,
    token: 'corner-radius-xlarge',
  },
];

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
    family: 'Helvetica Neue',
    style: 'Bold',
  },
  {
    family: 'Helvetica Neue',
    style: 'ExtraBold',
  },
  {
    family: 'Helvetica Neue',
    style: 'Black',
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
 * top-level (`main`) node and `group` node types.
 *
 * @kind constant
 * @name CONTAINER_NODE_TYPES
 * @type {Object}
 */
const CONTAINER_NODE_TYPES = {
  component: 'COMPONENT',
  componentSet: 'COMPONENT_SET',
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
  accessibilityDefault: {
    width: 360,
    // height: 306,
    height: 234,
  },
  default: {
    width: 360,
    // height: 306,
    height: 234,
  },
  input: {
    width: 440,
    height: 152,
  },
  info: {
    width: 360,
    height: 324,
  },
  mercadoDefault: {
    width: 360,
    // height: 366,
    height: 292,
  },
};

/**
 * @description An array of dropdown options for keystop keys.
 *
 * @kind constant
 * @name KEY_OPTS
 * @type {Array}
 */
const KEY_OPTS = [
  {
    value: 'no-key',
    text: 'Add key…',
    disabled: true,
  },
  {
    value: 'divider--01',
    text: null,
    disabled: true,
  },
  {
    value: 'arrows-left-right',
    text: 'Arrow keys (left/right)',
    disabled: false,
  },
  {
    value: 'arrows-up-down',
    text: 'Arrow keys (up/down)',
    disabled: false,
  },
  {
    value: 'enter',
    text: 'Enter',
    disabled: false,
  },
  {
    value: 'divider--02',
    text: null,
    disabled: true,
  },
  {
    value: 'space',
    text: 'Space',
    disabled: false,
  },
  {
    value: 'divider--03',
    text: null,
    disabled: true,
  },
  {
    value: 'escape',
    text: 'Escape',
    disabled: false,
  },
];

/**
 * @description An array of dropdown options for aria roles.
 *
 * @kind constant
 * @name ROLE_OPTS
 * @type {Array}
 */
const ROLE_OPTS = [
  {
    value: 'no-role',
    text: 'None',
    disabled: false,
  },
  {
    value: 'divider--01',
    text: null,
    disabled: true,
  },
  {
    value: 'image',
    text: 'Image',
    disabled: false,
  },
  {
    value: 'image-decorative',
    text: 'Image (decorative)',
    disabled: false,
  },
  {
    value: 'divider--02',
    text: null,
    disabled: true,
  },
  {
    value: 'button',
    text: 'Button',
    disabled: false,
  },
  {
    value: 'checkbox',
    text: 'Checkbox',
    disabled: false,
  },
  {
    value: 'link',
    text: 'Link',
    disabled: false,
  },
  {
    value: 'menuitem',
    text: 'Menu item',
    disabled: false,
  },
  {
    value: 'menuitemcheckbox',
    text: 'Menu item (checkbox)',
    disabled: false,
  },
  {
    value: 'menuitemradio',
    text: 'Menu item (radio)',
    disabled: false,
  },
  {
    value: 'option',
    text: 'Option',
    disabled: false,
  },
  {
    value: 'progressbar',
    text: 'Progress bar',
    disabled: false,
  },
  {
    value: 'radio',
    text: 'Radio',
    disabled: false,
  },
  {
    value: 'searchbox',
    text: 'Search box',
    disabled: false,
  },
  {
    value: 'slider',
    text: 'Slider',
    disabled: false,
  },
  {
    value: 'switch',
    text: 'Switch',
    disabled: false,
  },
  {
    value: 'tab',
    text: 'Tab',
    disabled: false,
  },
  {
    value: 'tabpanel',
    text: 'Tab panel',
    disabled: false,
  },
  {
    value: 'textbox',
    text: 'Textbox',
    disabled: false,
  },
  {
    value: 'divider--03',
    text: null,
    disabled: true,
  },
  {
    value: 'combobox',
    text: 'Combobox',
    disabled: false,
  },
  {
    value: 'listbox',
    text: 'Listbox',
    disabled: false,
  },
  {
    value: 'menu',
    text: 'Menu',
    disabled: false,
  },
  {
    value: 'radiogroup',
    text: 'Radio group',
    disabled: false,
  },
  {
    value: 'group',
    text: 'Group',
    disabled: false,
  },
  {
    value: 'tablist',
    text: 'Tab list',
    disabled: false,
  },
];

/**
 * @description An array of dropdown options for heading levels.
 *
 * @kind constant
 * @name LEVEL_OPTS
 * @type {Array}
 */
const LEVEL_OPTS = [
  {
    value: 'no-level',
    text: 'None  (iOS/Android)',
    disabled: false,
  },
  {
    value: 'divider--01',
    text: null,
    disabled: true,
  },
  {
    value: '1',
    text: '1',
    disabled: false,
  },
  {
    value: '2',
    text: '2',
    disabled: false,
  },
  {
    value: '3',
    text: '3',
    disabled: false,
  },
  {
    value: '4',
    text: '4',
    disabled: false,
  },
  {
    value: '5',
    text: '5',
    disabled: false,
  },
  {
    value: '6',
    text: '6',
    disabled: false,
  },
];


const INSTRUCTION_COMPONENT_KEYS = {
  instructionPanel: '37f07e866f47fa7bb2690a49897471f66f851eab',
  notesPanel: 'e2abd4594dd4c3bfc73887052d30d3918fcf288e',
  keystopLegendHeader: '9fa494a21433ee4fb9ff7094e7496434bb9d250c',
  labelLegendHeader: '25cb65871b0a5a1723ae3f80034695b5a4dd1f2f',
  headingLegendHeader: 'a5b054fac5e4436528b7fc620e86577af07963a3',
  miscLegendHeader: 'cbd3f74d35de28312dacbe356feb04f443443a10',
  keystopLegendTitle: 'aba413fb71dac7ee49380adea0db68163abb799a',
  labelLegendTitle: '3036d68a6c745100c6423ec2c34ea82632f28ad7',
  headingLegendTitle: 'bfa7582f5c869254913fc2e521e8d50721c03bfb',
  miscLegendTitle: 'dbd6f1e895ab49ac19666d686b29b4ef701650dd',
};

export {
  COLORS,
  CONTAINER_NODE_TYPES,
  DATA_KEYS,
  KEY_OPTS,
  GUI_SETTINGS,
  INSTRUCTION_COMPONENT_KEYS,
  LEVEL_OPTS,
  PLUGIN_IDENTIFIER,
  PLUGIN_NAME,
  RADIUS_MATRIX,
  ROLE_OPTS,
  SPACING_MATRIX,
  TYPEFACES,
};
/* eslint-enable import/prefer-default-export */
