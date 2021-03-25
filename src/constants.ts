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
  legendFrames: string,
  specPage: string,
  keystopList: string,
  labelList: string,
  headingList: string,
  legendLinkId: string,
  bundle: string,
  keystopNodeData: string,
  labelNodeData: string,
  headingNodeData: string,
  keystopLinkId: string,
  labelLinkId: string,
  headingLinkId: string,
  relaunch: string,
} = {
  // page-level (e.g. in case an annotated element is moved out of a frame?)
  options: `${PLUGIN_IDENTIFIER}.options-001`,
  keystopAnnotations: `${PLUGIN_IDENTIFIER}.keystopAnnotations-001`,
  labelAnnotations: `${PLUGIN_IDENTIFIER}.labelAnnotations-001`,
  headingAnnotations: `${PLUGIN_IDENTIFIER}.headingAnnotations-001`,
  legendFrames: `${PLUGIN_IDENTIFIER}.legendFrames-001`,
  specPage: `${PLUGIN_IDENTIFIER}.specPage-001`,
  // top-frame level
  keystopList: `${PLUGIN_IDENTIFIER}.keystopList-001`,
  labelList: `${PLUGIN_IDENTIFIER}.labelList-001`,
  headingList: `${PLUGIN_IDENTIFIER}.headingList-001`,
  legendLinkId: `${PLUGIN_IDENTIFIER}.legendLinkId-001`,
  // node-level and up
  bundle: `${PLUGIN_IDENTIFIER}.bundle-001`,
  keystopNodeData: `${PLUGIN_IDENTIFIER}.keystopNodeData-001`,
  labelNodeData: `${PLUGIN_IDENTIFIER}.labelNodeData-001`,
  headingNodeData: `${PLUGIN_IDENTIFIER}.headingNodeData-001`,
  keystopLinkId: `${PLUGIN_IDENTIFIER}.linkId-001`, // legacy, “.linkId”
  labelLinkId: `${PLUGIN_IDENTIFIER}.labelLinkId-001`,
  headingLinkId: `${PLUGIN_IDENTIFIER}.headingLinkId-001`,
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
} = {
  component: '#6255ca',
  custom: '#c8006a',
  dimension: '#4c7100',
  keystop: '#c8006a',
  label: '#0066bf',
  heading: '#bc3600',
  spacing: '#007373',
  style: '#bc3600',
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
    height: 180,
  },
  default: {
    width: 360,
    height: 250,
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
    width: 360,
    height: 230,
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

/**
 * @description An array of section heading and items to include in the a11y checklist.
 *
 * @kind constant
 * @name CHECKLIST_SECTIONS
 * @type {Array}
 */
 const CHECKLIST_SECTIONS = [
  {
    heading: 'Have you checked for color and contrast?',
    text: '[ ] Hue is never used as the sole means of conveying information.\n[ ] All text has at least 4.5:1 contrast with its surrounding color. \n    [ ] Exception: Large text (over 19px) has at least 3:1 contrast.\n[ ] For all controls, there is at least 3:1 contrast between the \n    surrouding color(s) and the color of every part of the control that is \n    essential to understand:\n    (A) what type of control it is, and \n    (B) the current value of the control.\n    [ ] There is at least 3:1 contrast between each of the possible states \n        of a control, unless something other than color is used to \n        distinguish states.\n[ ] For all graphical elements (e.g. images) that convey unique \n    information on a screen, every part of the graphic has at least 3:1 \n    contrast with its surrounding color.',
  },
  {
    heading: 'Is there text-equivalent for all visual information?',
    text: '[ ] All images have alt text.\n    [ ] Alt text provides a verbal equivalent of the image.\n[ ] All controls have visible text or image as a label (name)\n    [ ] Controls that use an image for the label also have a predictable \n        a11y label defined, or the image has alt text.\n    [ ] All unique controls have unique names (visible or a11y label).\n[ ] When a user can identify the type of control (i.e. role) based on \n    visual information, the role is clearly defined in the spec as well.',
  },
  {
    heading: 'Is the layout adaptable?',
    text: '[ ] All components that contain text adapt when users change text size or \n    text spacing, without loss of information necessary to understand and \n    use the app.\n[ ] The page layout responds to increases in zoom level (equivalent to \n    reducing the viewport dimensions) so that a user never has to scroll \n    the page in two dimensions.\n    [ ] Individual components in the page never require two-dimensional     \n        scroll.\n    [ ] Exception: maps, images, data tables.\n[ ] No content or functionality is restricted to any one device \n    orientation (e.g. landscape or portrait).',
  },
  {
    heading: 'Is the UI designed to be operable via any input modality?',
    text: '[ ] For every function that can be performed using a pointer input, a user \n    can perform the function using a keyboard alone.\n    [ ] Every focusable element (esp. controls) is represented in the \n        focus order definition.\n[ ] Every pointer interaction is operable via simple single-pointer \n    interactions. Examples: single click/tap, long press.\n    [ ] Exception: Gesture interactions are used only in cases where the \n        platform provides an single-pointer alternative to the gesture \n        (e.g. Android/iOS swipe gesture).\n[ ] Headings are identified in the spec.\n    [ ] Web only: Heading level is defined for each heading.',
  },
  {
    heading: 'Is the interface understandable?',
    text: '[ ] For relationships between elements that are conveyed visually, there \n    are clear definitions of that relationship for engineers to ensure \n    that the relationship is reflected programmatically, as well.\n[ ] All error states are clearly identified for users for:\n    (a) input-level errors, and\n    (b) page-level errors.\n    [ ] Error messaging includes instructions on what the user should do \n        to address the error.\n[ ] Elements that appear on multiple screens in an app use the same name\n    and behave predictably.',
  },
];

export {
  CHECKLIST_SECTIONS,
  COLORS,
  CONTAINER_NODE_TYPES,
  DATA_KEYS,
  KEY_OPTS,
  GUI_SETTINGS,
  LEVEL_OPTS,
  PLUGIN_IDENTIFIER,
  PLUGIN_NAME,
  RADIUS_MATRIX,
  ROLE_OPTS,
  SPACING_MATRIX,
  TYPEFACES,
};
/* eslint-enable import/prefer-default-export */
