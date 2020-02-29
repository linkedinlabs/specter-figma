import {
  CONTAINER_NODE_TYPES,
  GUI_SETTINGS,
  PLUGIN_IDENTIFIER,
} from './constants';

const hexRgb = require('hex-rgb');

// --- helper functions
/**
 * @description A reusable helper function to take an array and add or remove data from it
 * based on a top-level key and a defined action.
 * an action (`add` or `remove`).
 *
 * @kind function
 * @name updateArray
 *
 * @param {string} key String representing the top-level area of the array to modify.
 * @param {Object} item Object containing the new bit of data to add or
 * remove (must include an `id` string for comparison).
 * @param {Array} array The array to be modified.
 * @param {string} action Constant string representing the action to take (`add` or `remove`).
 *
 * @returns {Object} The modified array.
 * @private
 */
const updateArray = (
  key: string,
  item: { id: string },
  array: Array<any>,
  action: 'add' | 'remove' = 'add',
) => {
  let updatedItems = null;
  const updatedArray = array;

  // initialize the key if it does not exist
  if (!updatedArray[key]) {
    updatedArray[key] = [];
  }

  // find the index of a pre-existing `id` match on the array
  const itemIndex: number = updatedArray[key].findIndex(foundItem => (foundItem.id === item.id));

  // if a match exists, remove it
  // even if the action is `add`, always remove the existing entry to prevent duplicates
  if (itemIndex > -1) {
    updatedItems = [
      ...updatedArray[key].slice(0, itemIndex),
      ...updatedArray[key].slice(itemIndex + 1),
    ];

    updatedArray[key] = updatedItems;
  }

  // if the `action` is `add`, append the new `item` to the array
  if (action === 'add') {
    updatedArray[key].push(item);
  }

  return updatedArray;
};

/**
 * @description A helper function to take a hexcolor string, conver it to an object in RGB format,
 * and further convert the `red`, `green`, and `blue` values to a decimal value.
 *
 * @kind function
 * @name hexToDecimalRGB
 * @param {string} hexColor A color in hex format (i.e. `#ffcc00`).
 *
 * @returns {Object} A representation of the original hex color in red, green, and blue (`r`,
 * `g`, `b`) decimal values.
 */
const hexToDecimalRgb = (hexColor: string): {
  r: number,
  g: number,
  b: number,
} => {
  const rgbColor: { red: number, green: number, blue: number } = hexRgb(hexColor);

  const r: number = (rgbColor.red / 255);
  const g: number = (rgbColor.green / 255);
  const b: number = (rgbColor.blue / 255);

  const decimalRgb: { r: number, g: number, b: number } = { r, g, b };
  return decimalRgb;
};

/**
 * @description Takes a string and converts everything except for the first alpha-letter to
 * lowercase. It also capitalizes the first alpha-letter.
 *
 * @kind function
 * @name toSentenceCase
 * @param {string} anyString String of text to title-case.
 *
 * @returns {string} The title-cased string.
 */
const toSentenceCase = (anyString: string): string => {
  const lowerCaseString = anyString.toLowerCase();
  const titleCaseString = lowerCaseString.replace(
    /[a-z]/i,
    firstLetter => firstLetter.toUpperCase(),
  ).trim();

  return titleCaseString;
};

/**
 * @description Takes a node object and traverses parent relationships until the top-level
 * `FrameNode` (or `PageNode`) is found. Returns the node.
 *
 * @kind function
 * @name findFrame
 * @param {Object} node A Figma node object.
 *
 * @returns {Object} The top-level node.
 */
const findFrame = (node: any): FrameNode => {
  let { parent } = node;

  // if the parent is a page, we're done
  if (parent && parent.type === 'PAGE') {
    return null;
  }

  // loop through each parent until we find the outermost FRAME
  if (parent) {
    while (parent && parent.parent.type !== 'PAGE') {
      parent = parent.parent;
    }
  }
  return parent;
};

/**
 * @description Reverse iterates the node tree to determine the immediate parent component instance
 * (if one exists) for the node.
 *
 * @kind function
 * @name findParentInstance
 *
 * @param {Object} node A Figma node object (`SceneNode`).
 *
 * @returns {Object} Returns the top component instance (`InstanceNode`) or `null`.
 */
const findParentInstance = (node: any) => {
  let { parent } = node;
  let currentNode = node;
  let currentTopInstance: InstanceNode = null;

  // return self if already typed as instance
  if (currentNode.type === CONTAINER_NODE_TYPES.instance) {
    currentTopInstance = currentNode;
    return currentTopInstance;
  }

  if (parent) {
    // return immediate parent if already typed as instance
    if (parent.type === CONTAINER_NODE_TYPES.instance) {
      currentTopInstance = parent;
      return currentTopInstance;
    }

    // iterate until the parent is an instance
    while (parent && parent.type !== CONTAINER_NODE_TYPES.instance) {
      currentNode = parent;
      if (currentNode.type === CONTAINER_NODE_TYPES.instance) {
        // update the top-most master component with the current one
        currentTopInstance = currentNode;
      }
      parent = parent.parent;
    }
  }

  return currentTopInstance;
};

/**
 * @description Takes an array of typefaces (`FontName`), iterates through the array, checking
 * the system available of each typeface and loading the first available.
 *
 * @kind function
 * @name loadFirstAvailableFontAsync
 * @param {Array} typefaces Array of typefaces in the `FontName` format.
 *
 * @returns {Object} Returns the first successfully-loaded `FontName`.
 */
const loadFirstAvailableFontAsync = async (typefaces: Array<FontName>) => {
  let typefaceToUse = null;
  const availableFonts: Array<Font> = await figma.listAvailableFontsAsync();

  // check if a `typeface` is listed in `availableFonts`
  // family AND style must match
  const isAvailable = (typeface: FontName) => availableFonts.filter(
    font => (
      (font.fontName.family === typeface.family)
      && (font.fontName.style === typeface.style)
    ),
  );

  // iterate through `typefaces` array and find the first available
  typefaces.forEach((typeface) => {
    if (!typefaceToUse && isAvailable(typeface).length > 0) {
      typefaceToUse = typeface;
    }
  });

  // load the typeface
  await figma.loadFontAsync(typefaceToUse);

  return typefaceToUse;
};

/**
 * @description Compensates for a mix of groups and non-groups when determining a
 * layer index. Grouped layers are parsed to a decimal value that includes the final
 * parent Group index.
 *
 * @kind function
 * @name getRelativeIndex
 * @param {Object} layer The Figma layer.
 * @returns {number} The index.
 * @private
 */
const getRelativeIndex = (layer): number => {
  const getIndex = (layerSet, comparisonLayer): number => {
    const index = layerSet.findIndex(node => node === comparisonLayer);
    return index;
  };

  const parentChildren = layer.parent.children;
  let layerIndex: number = getIndex(parentChildren, layer);

  const innerLayerIndex = layerIndex;
  let parentGroupIndex: number = null;

  let { parent } = layer;
  // loop through each parent and adjust the coordinates
  if (parent) {
    while (parent.type === CONTAINER_NODE_TYPES.group) {
      const parentParentChildren = parent.parent.children;
      parentGroupIndex = getIndex(parentParentChildren, parent);
      parent = parent.parent; // eslint-disable-line prefer-destructuring
    }

    if (parentGroupIndex !== null) {
      layerIndex = parseFloat(`${parentGroupIndex}.${innerLayerIndex}`);
    }
  }

  return layerIndex;
};

/**
 * @description Takes a node and a parent node (does not need to be a direct parent) and
 * calculates the relative `x`/`y` from the child to parent using `absoluteTransform`.
 *
 * @kind function
 * @name getRelativePosition
 * @param {Object} node A SceneNode layer object that is a child of `parentNode`.
 * @param {Object} parentNode A SceneNode layer object that is a parent of the `node`. It
 * does not need to be a direct parent.
 *
 * @returns {Object} A `relativePosition` object containing `x` and `y`.
 */
const getRelativePosition = (
  node: SceneNode,
  parentNode: SceneNode,
) => {
  let parentX = 0;
  let parentY = 0;

  // cannot assume `parentNode` has `absoluteTransform` – `PageNode`’s do not, for example
  if (parentNode.absoluteTransform) {
    parentX = parentNode.absoluteTransform[0][2];
    parentY = parentNode.absoluteTransform[1][2];
  }

  const relativeX: number = node.absoluteTransform[0][2] - parentX;
  const relativeY: number = node.absoluteTransform[1][2] - parentY;

  const relativePosition: {
    x: number,
    y: number,
  } = {
    x: relativeX,
    y: relativeY,
  };

  return relativePosition;
};

/**
 * @description Takes a Figma page object and a `layerId` and uses the Figma API’s
 * `getPluginData` to extract and return a specific layer’s settings.
 *
 * @kind function
 * @name getLayerSettings
 * @param {Object} page A Figma page object.
 * @param {string} layerId A string representing a layer ID.
 *
 * @returns {Object} The settings object that corresponds to the supplied `layerId`.
 */
const getLayerSettings = (page: any, layerId: string) => {
  const pageSettings = JSON.parse(page.getPluginData(PLUGIN_IDENTIFIER) || null);
  let layerSettings: any = null;
  if (pageSettings && pageSettings.layerSettings) {
    const settingSetIndex = pageSettings.layerSettings.findIndex(
      settingsSet => (settingsSet.id === layerId),
    );
    layerSettings = pageSettings.layerSettings[settingSetIndex];
  }

  return layerSettings;
};

/**
 * @description Takes a Figma page object, updated layer settings, and saves the updates
 * to the core page’s plugin settings using the Figma API’s `getPluginData` and
 * `setPluginData`.
 *
 * @kind function
 * @name setLayerSettings
 * @param {Object} page A Figma page object.
 * @param {Object} newLayerSettings An object containing the settings for a specific layer.
 * This object will be added to (or replace) the `layerSettings` node of the plugin settings.
 *
 * @returns {null}
 */
const setLayerSettings = (page: any, newLayerSettings: any): void => {
  const pageSettings = JSON.parse(page.getPluginData(PLUGIN_IDENTIFIER) || null);
  let newPageSettings: any = {};
  if (pageSettings) {
    newPageSettings = pageSettings;
  }

  // update the `newPageSettings` array with `newLayerSettings`
  newPageSettings = updateArray(
    'layerSettings',
    newLayerSettings,
    newPageSettings,
    'add',
  );

  // commit the `Settings` update
  page.setPluginData(
    PLUGIN_IDENTIFIER,
    JSON.stringify(newPageSettings),
  );

  return null;
};

/**
 * @description Resizes the plugin iframe GUI within the Figma app.
 *
 * @kind function
 * @name resizeGUI
 * @param {string} type A string representing the `type` of GUI to load.
 * @param {Function} ui An instance of `figma.ui` with the GUI pre-loaded.
 *
 * @returns {null}
 */
const resizeGUI = (
  type: string,
  ui: { resize: Function },
): void => {
  ui.resize(
    GUI_SETTINGS[type].width,
    GUI_SETTINGS[type].height,
  );

  return null;
};

/**
 * @description Checks the `FEATURESET` environment variable from webpack and
 * determines if the featureset build should be `internal` or not.
 *
 * @kind function
 * @name isInternal
 *
 * @returns {boolean} `true` if the build is internal, `false` if it is not.
 */
const isInternal = (): boolean => {
  const buildIsInternal: boolean = process.env.FEATURESET === 'internal';
  return buildIsInternal;
};

/**
 * @description Check if a node (or any of its parents) are hidden and returns false if they are.
 *
 * @kind function
 * @name isVisible
 *
 * @param {Object} node A Figma `SceneNode` object.
 *
 * @returns {boolean} `true` if the build is internal, `false` if it is not.
 */
const isVisible = (node: SceneNode): boolean => {
  // if original node is hidden, no need to proceed
  if (!node.visible) { return false; }

  if (
    node.parent.type !== 'PAGE'
    && node.parent.type !== 'DOCUMENT'
  ) {
    return isVisible(node.parent);
  }

  return true;
};

export {
  findFrame,
  findParentInstance,
  getLayerSettings,
  getRelativeIndex,
  getRelativePosition,
  hexToDecimalRgb,
  isInternal,
  isVisible,
  loadFirstAvailableFontAsync,
  resizeGUI,
  setLayerSettings,
  toSentenceCase,
  updateArray,
};
