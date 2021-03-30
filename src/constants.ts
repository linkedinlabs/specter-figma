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
 * @name A11Y_CHECKLIST_TEXT
 * @type {Array}
 */
 const A11Y_CHECKLIST_TEXT = {
  intro: 'This checklist contains common a11y \'gotchas\' that can not be automated by the plugin.  Please use this as a reference to check your designs and make any necessary updates.',
  sections: [
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
  ]
};

/**
 * @description An array of section heading and items to include in the a11y checklist.
 *
 * @kind constant
 * @name SPEC_INSTRUCTION_TEXT
 * @type {Object}
 */
 const SPEC_INSTRUCTION_TEXT = {
  intro: 'This template is intended to promote spec consistency and give designers of all levels a starting point in creating thorough design specs for engineering.\nGiven that different assignments will require different specs, we ask that you fill out as much as you can that could be helpful to engineers and skip over anything that is not relevant to this assignment. If you have questions, please contact Jeff, Nate, or Lisamarie.',
  sections: [
    {
      annotationType: 'component',
      annotationText: 'slider',
      heading: 'DS Components',
      text: 'Use each frame\'s first duplicate named \'DS COMPONENT Spec\' for annotating with the \'Annotate\' option in the \'General\' tab of Specter.\nThis should include design system component information that may be helpful to engineers implementing the design.\nIf data has been attached by an admin to any components that have come from the LinkedIn Design System, you will automatically be provided that value in a purple annotation.  Otherwise, you will be prompted to enter your own custom value and that will be reflected as a pink annotation.',
    },
    {
      annotationType: 'spacing',
      annotationText: '120dp',
      heading: 'DS Size/Spacing',
      text: 'Use each frame\'s first duplicate named \'DS SPACING Spec\' for annotating with the \'Measure\' option in the \'General\' tab of Specter.\nThis should include design system measurement/spacing information that may be helpful to engineers implementing the design.\nIf data has been attached by an admin to any components that have come from the LinkedIn Design System or if Specter finds a token that represents the spacing detected, you will automatically be provided that value.  Otherwise, it will calculate a value.  Size annotations are in green annotations, and spacing in teal annotations.',
    },
    {
      annotationType: 'keystop',
      heading: 'Keyboard/Focus',
      text: 'Use each frame\'s second duplicate named \'KEYSTOP Spec\' for annotating with the \'Keyboard\' tab of Specter.\nThis will provide you with an automated system for ordered number annotations that point to the keys associated with each keystop in a legend to the right of the duplicated frame.  Those keys indicate how the user can interact with the element using their keyboard, and can either come automatically from data attached by an admin or by entering them yourself in the UI.  You can continue to add, delete, or reorder any keystops in the list within the UI, and the system will automatically update the list order.\nTip: The automatic ordering system goes from top-left to bottom-right, so if you want certain sections of the frame to be ordered before moving further to the bottom-right, select everything you want to add a keystop to in that section and apply annotations section-by-section.',
    },
    {
      annotationType: 'label',
      heading: 'Labels',
      text: 'Use each frame\'s third duplicate named \'LABEL Spec\' for annotating with the \'Labels\' tab of Specter.\nThis uses the same numbered pointer system as keystops (see above), and also may provide data that was attached by an admin.  Labels data includes:\n- ROLE: This is the purpose of the element (and for engineers, the semantic tag that should be used).\n- VISIBLE: This indicates whether the visible element text and/or role is a thorough description of what the element is/does for screen reader users.  If it isn\'t, think about whether the text should be modified, or turn \'Visible\' off and add a thorough description to the \'A11y\' field instead for screen readers to use.\n- A11Y: This is an alternate/additional value the screen reader will play when the element is focused (and for engineering, should be used as aria-label).  This should be used if the visible element text and/or role is not an explanatory description of what the element is/does (e.g. if a \'Next\' button only contains an arrow icon, and non-sighted need the screen reader to tell them it is a \'Next\' button.\n- ALT: This is alternative text that describes what an image depicts and should always be included with images that aren\'t purely decorative.  This field will only show when the selected Role is \'image\'.',
    },
    {
      annotationType: 'heading',
      heading: 'Headings',
      text: 'Use each frame\'s last duplicate named \'HEADING Spec\' for annotating with the \'Heading\' tab of Specter.\nThis also uses the same numbered pointer system as keystops and labels (see above), and also may provide data that was attached by an admin.  Heading data includes:\n- LEVEL: This is for organizing the nested structure of headings, e.g. each web page should only have one level 1 heading that names the page, the next level should start at 2 for page sections, any headings nested inside a section with a level 2 heading should then be 3, and so on (and for engineering, the semantic tag that should be used e.g. \'h1\').\n- VISIBLE: This indicates whether the visible heading text is a thorough description of the content the heading describes.  If it isn\'t, think about whether the text should be modified, or turn \'Visible\' off and add a thorough description to the \'Heading\' field instead for screen readers to use.\n- HEADING: This is an alternate/additional value the screen reader will play when the heading is announced (and for engineering, should be used as aria-label).  This should be used if the visible heading text is not an explanatory description of the content the heading refers to.',
    },
  ]
};

export {
  A11Y_CHECKLIST_TEXT,
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
  SPEC_INSTRUCTION_TEXT,
  TYPEFACES,
};
/* eslint-enable import/prefer-default-export */
