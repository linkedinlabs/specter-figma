import {
  CONTAINER_NODE_TYPES,
  GUI_SETTINGS,
  PLUGIN_IDENTIFIER,
} from './constants';

const hexRgb = require('hex-rgb');

// --- helper functions
/**
 * @description An approximation of `setTimeout` but run in an async manner
 * with logging to Messenger.
 *
 * @kind function
 * @name pollWithPromise
 *
 * @param {Function} externalCheck The external function to run a check against.
 * The function should resolve to `true`.
 * @param {Object} messenger An initialized instance of the Messenger class for logging (optional).
 * @param {string} name The name of the check for logging purposes (optional).
 *
 * @returns {Promise} Returns a promise for resolution.
 */
const pollWithPromise = (
  externalCheck: Function,
  messenger?: { log: Function },
  name?: string,
): Promise<Function> => {
  const isReady: Function = externalCheck;
  const checkName = name || externalCheck.name;

  const checkIsReady = (resolve) => {
    if (messenger) { messenger.log(`Checking: ${checkName} 🤔`); }

    if (isReady()) {
      if (messenger) { messenger.log(`Resolve ${checkName} 🙏`); }

      resolve(true);
    } else {
      setTimeout(checkIsReady, 25, resolve);
    }
  };
  return new Promise(checkIsReady);
};

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
      if (currentNode.parent.type === CONTAINER_NODE_TYPES.instance) {
        // update the top-most instance component with the current one
        currentTopInstance = currentNode.parent;
      }
      parent = currentNode.parent;
    }
  }

  return currentTopInstance;
};

// we need to wait for the UI to be ready:
// network calls are made through the UI iframe
const awaitUIReadiness = async (messenger?) => {
  // set UI readiness check to falsey
  let ready = false;

  // simple function to check truthiness of `ready`
  const isUIReady = () => ready;

  // set a one-time use listener
  figma.ui.once('message', (msg) => {
    if (msg && msg.loaded) { ready = true; }
  });

  await pollWithPromise(isUIReady, messenger);
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
 * node index. Grouped nodes are parsed to a decimal value that includes the final
 * parent Group index.
 *
 * @kind function
 * @name getRelativeIndex
 * @param {Object} node The Figma node.
 * @returns {number} The index.
 * @private
 */
const getRelativeIndex = (node): number => {
  const getIndex = (nodeSet, comparisonNode): number => {
    const index = nodeSet.findIndex(singleNode => singleNode === comparisonNode);
    return index;
  };

  const parentChildren = node.parent.children;
  let nodeIndex: number = getIndex(parentChildren, node);

  const innerNodeIndex = nodeIndex;
  let parentGroupIndex: number = null;

  let { parent } = node;
  // loop through each parent and adjust the coordinates
  if (parent) {
    while (parent.type === CONTAINER_NODE_TYPES.group) {
      const parentParentChildren = parent.parent.children;
      parentGroupIndex = getIndex(parentParentChildren, parent);
      parent = parent.parent; // eslint-disable-line prefer-destructuring
    }

    if (parentGroupIndex !== null) {
      nodeIndex = parseFloat(`${parentGroupIndex}.${innerNodeIndex}`);
    }
  }

  return nodeIndex;
};

/**
 * @description Takes a node and a parent node (does not need to be a direct parent) and
 * calculates the relative `x`/`y` from the child to parent using `absoluteTransform`.
 *
 * @kind function
 * @name getRelativePosition
 * @param {Object} node A SceneNode object that is a child of `parentNode`.
 * @param {Object} parentNode A SceneNode object that is a parent of the `node`. It
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
 * @description Takes a Figma page object and a `nodeId` and uses the Figma API’s
 * `getPluginData` to extract and return a specific node’s settings.
 *
 * @kind function
 * @name getNodeSettings
 * @param {Object} page A Figma page object.
 * @param {string} nodeId A string representing a node ID.
 *
 * @returns {Object} The settings object that corresponds to the supplied `nodeId`.
 */
const getNodeSettings = (page: any, nodeId: string) => {
  const pageSettings = JSON.parse(page.getPluginData(PLUGIN_IDENTIFIER) || null);
  let nodeSettings: any = null;
  if (pageSettings && pageSettings.layerSettings) {
    const settingSetIndex = pageSettings.layerSettings.findIndex(
      settingsSet => (settingsSet.id === nodeId),
    );
    nodeSettings = pageSettings.layerSettings[settingSetIndex];
  }

  return nodeSettings;
};

/**
 * @description Takes a Figma page object, updated node settings, and saves the updates
 * to the core page’s plugin settings using the Figma API’s `getPluginData` and
 * `setPluginData`.
 *
 * @kind function
 * @name setNodeSettings
 * @param {Object} page A Figma page object.
 * @param {Object} newNodeSettings An object containing the settings for a specific node.
 * This object will be added to (or replace) the `layerSettings` node of the plugin settings.
 *
 * @returns {null}
 */
const setNodeSettings = (page: any, newNodeSettings: any): void => {
  const pageSettings = JSON.parse(page.getPluginData(PLUGIN_IDENTIFIER) || null);
  let newPageSettings: any = {};
  if (pageSettings) {
    newPageSettings = pageSettings;
  }

  // update the `newPageSettings` array with `newNodeSettings`
  newPageSettings = updateArray(
    'layerSettings',
    newNodeSettings,
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
  awaitUIReadiness,
  findFrame,
  findParentInstance,
  getNodeSettings,
  getRelativeIndex,
  getRelativePosition,
  hexToDecimalRgb,
  isInternal,
  isVisible,
  loadFirstAvailableFontAsync,
  resizeGUI,
  setNodeSettings,
  toSentenceCase,
  updateArray,
};
