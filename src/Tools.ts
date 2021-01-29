import {
  CONTAINER_NODE_TYPES,
  DATA_KEYS,
  GUI_SETTINGS,
  PLUGIN_IDENTIFIER,
} from './constants';

const hexRgb = require('hex-rgb');

// --- helper functions other Tools depend on
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
 * @description A reusable helper function to take an array and check if an item exists
 * based on a `key`/`value` pair.
 *
 * @kind function
 * @name existsInArray
 *
 * @param {Array} array The array to be checked.
 * @param {string} value The value to test against `key`.
 * @param {string} key String representing the key to match against `value` (default is `id`).
 *
 * @returns {boolean}
 */
const existsInArray = (
  array: Array<any>,
  value,
  key: string = 'id',
) => {
  let doesExist = false;
  const itemIndex = array.findIndex(
    foundItem => (foundItem[key] === value),
  );

  if (itemIndex > -1) {
    doesExist = true;
  }

  return doesExist;
};

/**
 * @description A reusable helper function to take an array and add or remove data from it
 * based on a top-level key and a defined action.
 *
 * @kind function
 * @name updateArray
 *
 * @param {Array} array The array to be modified.
 * @param {Object} item Object containing the new bit of data to add, remove, or update.
 * @param {string} itemKey String representing the key to match (default is `id`).
 * @param {string} action Constant string representing the action to take
 * (`add`, `update`, or `remove`).
 *
 * @returns {Object} The modified array.
 */
const updateArray = (
  array: Array<any>,
  item,
  itemKey: string = 'id',
  action: 'add' | 'update' | 'remove' = 'add',
) => {
  let updatedArray = array;

  // find the index of a pre-existing `id` match on the array
  const itemIndex: number = updatedArray.findIndex(
    foundItem => (foundItem[itemKey] === item[itemKey]),
  );

  // if a match exists, remove it
  // even if the action is `add`, always remove the existing entry to prevent duplicates
  if (itemIndex > -1) {
    updatedArray = [
      ...updatedArray.slice(0, itemIndex),
      ...updatedArray.slice(itemIndex + 1),
    ];
  }

  // if the `action` is `add` (or update), append the new `item` to the array
  if (action !== 'remove') {
    updatedArray.push(item);
  }

  return updatedArray;
};

/**
 * @description A reusable helper function to take an array and add or remove data from it
 * based on a top-level key and a defined action.
 * an action (`add` or `remove`).
 *
 * @kind function
 * @name updateNestedArray
 *
 * @param {Array} parentArray The array to be modified.
 * @param {Object} item Object containing the new bit of data to add, remove or
 * update (must include an `id` string for comparison).
 * @param {string} subArrayKey String representing the top-level area of the array to modify.
 * @param {string} action Constant string representing the action to take
 * (`add`, `update`, or `remove`).
 *
 * @returns {Object} The modified array.
 * @private
 */
const updateNestedArray = (
  parentArray: Array<any>,
  item: { id: string },
  subArrayKey: string,
  action: 'add' | 'update' | 'remove' = 'add',
) => {
  // set initial array reference
  const updatedArray = parentArray;

  // initialize the sub array if it does not exist
  if (!updatedArray[subArrayKey]) {
    updatedArray[subArrayKey] = [];
  }

  // update the sub array
  const updatedItems = updateArray(updatedArray[subArrayKey], item, 'id', action);
  updatedArray[subArrayKey] = updatedItems;

  return updatedArray;
};

// --- helper functions
/**
 * @description An approximation of `forEach` but run in an async manner.
 *
 * @kind function
 * @name asyncForEach
 *
 * @param {Array} array An array to iterate.
 * @param {Function} callback A function to feed the single/iterated item back to.
 *
 * @returns {null} Runs the callback function.
 */
const asyncForEach = async (
  array: Array<any>,
  callback: Function,
): Promise<Function> => {
  for (let index = 0; index < array.length; index += 1) {
    await callback(array[index], index, array); // eslint-disable-line no-await-in-loop
  }
  return null;
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
 * @description Takes two one-dimensional arrays and compare them. Returns `true` if they
 * are different. Order of the array does not matter.
 *
 * @kind function
 * @name compareArrays
 *
 * @param {Array} array1 A one-dimensional array.
 * @param {Array} array2 A one-dimensional array to compare against.
 *
 * @returns {boolean} Returns `true` if the arrays are different, `false` if they have identical
 * values.
 */
const compareArrays = (array1: Array<any>, array2: Array<any>) => {
  // compares two values; uses `deepCompare` if values are an object
  const isMatch = (value1: any, value2: any) => {
    let match = false;
    if ((typeof value1 === 'object') && (value1 !== null)) {
      match = !deepCompare(value1, value2); // eslint-disable-line no-use-before-define
    } else {
      match = (value2 === value1);
    }
    return match;
  };

  let isDifferent = false;

  if (!array1 && !array2) {
    return isDifferent;
  }

  if (
    (!array1 && array2)
    || (!array2 && array1)
  ) {
    isDifferent = true;
    return isDifferent;
  }

  if (array1.length !== array2.length) {
    isDifferent = true;
    return isDifferent;
  }

  array1.forEach((value) => {
    const itemIndex = array2.findIndex(foundValue => isMatch(value, foundValue));

    if (itemIndex < 0) {
      isDifferent = true;
    }
  });

  if (isDifferent) {
    return isDifferent;
  }

  array2.forEach((value) => {
    const itemIndex = array1.findIndex(foundValue => isMatch(value, foundValue));

    if (itemIndex < 0) {
      isDifferent = true;
    }
  });

  return isDifferent;
};

/**
 * @description Compares two multi-dimensional objects. Returns `true` if they are different.
 *
 * @kind function
 * @name deepCompare
 *
 * @param {Object} unmodifiedObject An object to compare.
 * @param {Object} modifiedObject An object to compare against `unmodifiedObject`.
 *
 * @returns {boolean} Returns `true` if the objects are different, `false` if they are identical.
 */
const deepCompare = (unmodifiedObject: Object, modifiedObject: Object) => {
  let isDifferent: boolean = false;

  if (typeof unmodifiedObject !== 'object' || unmodifiedObject === null) {
    return isDifferent;
  }

  Object.entries(unmodifiedObject).forEach(([key, value]) => {
    // check for inner object first
    if ((typeof value === 'object') && (value !== null)) {
      if (
        modifiedObject[key] === undefined
        || deepCompare(value, modifiedObject[key])
      ) {
        isDifferent = true;
      }

      if (value.constructor === Array) {
        if (compareArrays(value, modifiedObject[key])) {
          isDifferent = true;
        }
      }
    } else if (modifiedObject[key] !== value) {
      if (modifiedObject[key] !== 'blank--multiple') {
        isDifferent = true;
      }
    }
  });

  return isDifferent;
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

/**
 * @description Takes a node object and traverses parent relationships until the top-level
 * `CONTAINER_NODE_TYPES.frame` node is found. Returns the frame node.
 *
 * @kind function
 * @name findTopFrame
 * @param {Object} node A Figma node object.
 *
 * @returns {Object} The top-level `CONTAINER_NODE_TYPES.frame` node.
 */
//
const findTopFrame = (node: any) => {
  let { parent } = node;

  // if the parent is a page, we're done
  if (parent && parent.type === 'PAGE') {
    if (
      (node.type === CONTAINER_NODE_TYPES.frame)
      || (node.type === CONTAINER_NODE_TYPES.component)
    ) {
      return node;
    }
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
 * @description Reverse iterates the node tree to determine the top-level component instance
 * (if one exists) for the node. This allows you to easily find a Master Component when dealing
 * with an instance that may be nested within several component instances.
 *
 * @kind function
 * @name findTopInstance
 *
 * @param {Object} node A Figma node object (`SceneNode`).
 *
 * @returns {Object} Returns the top component instance (`InstanceNode`) or `null`.
 */
const findTopInstance = (node: any): InstanceNode => {
  let { parent } = node;
  let currentNode = node;
  let currentTopInstance: InstanceNode = null;

  // set first; top instance may be self
  if (currentNode.type === CONTAINER_NODE_TYPES.instance) {
    currentTopInstance = currentNode;
  }

  if (parent) {
    // iterate until the parent is a page
    while (parent && parent.type !== 'PAGE') {
      currentNode = parent;
      if (currentNode.type === CONTAINER_NODE_TYPES.instance) {
        // update the top-most main component with the current one
        currentTopInstance = currentNode;
      }
      parent = parent.parent;
    }
  }

  if (currentTopInstance) {
    return currentTopInstance;
  }
  return null;
};

/**
 * @description Reverse iterates the node tree to determine the top-level component
 * (if one exists) for the node. This allows you to check if a node is part of a component.
 *
 * @kind function
 * @name findTopComponent
 *
 * @param {Object} node A Figma node object (`SceneNode`).
 *
 * @returns {Object} Returns the component (`ComponentNode`) or `null`.
 */
const findTopComponent = (node: any) => {
  // return self if component
  if (node.type === CONTAINER_NODE_TYPES.component) {
    return node;
  }

  let { parent } = node;
  let currentNode = node;
  let componentNode: ComponentNode = null;
  if (parent) {
    // iterate until the parent is a page or component is found;
    // components cannot nest inside other components, so we can stop at the first
    // found component
    while (parent && parent.type !== 'PAGE' && componentNode === null) {
      currentNode = parent;
      if (currentNode.type === CONTAINER_NODE_TYPES.component) {
        // update the top-most main component with the current one
        componentNode = currentNode;
      }
      parent = parent.parent;
    }
  }

  if (componentNode) {
    return componentNode;
  }
  return null;
};

/**
 * @description Maps the nesting order of a node within the tree and then uses that “map”
 * as a guide to find the peer node within the an instance’s Master Component.
 *
 * @kind function
 * @name matchMasterPeerNode
 *
 * @param {Object} node A Figma node object (`SceneNode`).
 * @param {Object} topNode A Figma instance node object (`InstanceNode`).
 *
 * @returns {Object} Returns the main component or `null`.
 */
const matchMasterPeerNode = (node: any, topNode: InstanceNode) => {
  // finds the `index` of self in the parent’s children list
  const indexAtParent = (childNode: any): number => childNode.parent.children.findIndex(
    child => child.id === childNode.id,
  );

  // set some defaults
  let { parent } = node;
  const childIndices = [];
  const mainComponentNode: ComponentNode = topNode.mainComponent;
  let mainPeerNode = null;
  let currentNode = node;

  // if `node` and `topNode` are the same, the peer node is top-level and we
  // do not need to find anything else
  if (mainComponentNode && node.id === topNode.id) {
    return mainComponentNode;
  }

  // iterate up the chain, collecting indices in each child list
  if (parent) {
    childIndices.push(indexAtParent(node));
    while (parent && parent.id !== topNode.id) {
      currentNode = parent;
      parent = parent.parent;
      childIndices.push(indexAtParent(currentNode));
    }
  }

  // navigate down the chain of the corresponding main component using the
  // collected child indices to locate the peer node
  if (childIndices.length > 0 && mainComponentNode) {
    const childIndicesReversed = childIndices.reverse();
    let { children } = mainComponentNode;
    let selectedChild = null;

    childIndicesReversed.forEach((childIndex, index) => {
      selectedChild = children[childIndex];
      if ((childIndicesReversed.length - 1) > index) {
        if (selectedChild.children) {
          children = selectedChild.children;
        }
      }
    });

    // the last selected child should be the peer node
    if (selectedChild) {
      mainPeerNode = selectedChild;
    }
  }

  return mainPeerNode;
};

/**
 * @description Takes a number and converts it to a letterset representation (A, AA, BA, etc.).
 *
 * @kind function
 * @name numberToLetters
 * @param {number} num The order number of the annotation.
 *
 * @returns {string} The letter version of that number.
 */
const numberToLetters = (num: number): string => {
  let number: number = num;
  let letters: string = '';
  let counter;

  while (number > 0) {
    counter = (number - 1) % 26;
    letters = String.fromCharCode(65 + counter) + letters;
    number = Math.floor((number - counter) / 26);
  }
  return letters || undefined;
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
 * @description A shared helper function to retrieve plugin data on a node from a
 * peer plugin (Stapler). The check is always done on a component node to get the
 * latest data.
 *
 * @kind function
 * @name getPeerPluginData
 *
 * @param {Object} node The instance node to retrieve the assignment on.
 *
 * @returns {string} The assignment is returned as an unparsed JSON string.
 */
const getPeerPluginData = (
  node: InstanceNode | ComponentNode | ComponentSetNode,
) => {
  const dataNamespace = (): string => {
    const key: string = process.env.SECRET_KEY ? process.env.SECRET_KEY : '1234';
    const identifier: string = PLUGIN_IDENTIFIER;
    let namespace: string = `${identifier.toLowerCase()}${key.toLowerCase()}`;
    namespace = namespace.replace(/[^0-9a-z]/gi, '');
    return namespace;
  };

  const dataKey: string = DATA_KEYS.bundle;
  let pluginData: string = null;
  let parsedData = null;

  // check the component directly, first
  if (
    (node.type === CONTAINER_NODE_TYPES.component)
    || (node.type === CONTAINER_NODE_TYPES.componentSet)
  ) {
    pluginData = node.getSharedPluginData(
      dataNamespace(),
      dataKey,
    );
  }

  if (!pluginData) {
    let instanceNode: InstanceNode = null;

    if (node.type === CONTAINER_NODE_TYPES.instance) {
      instanceNode = node as InstanceNode;
    }

    // check the instance’s direct component
    if (instanceNode && instanceNode.mainComponent) {
      let componentNode: ComponentNode = null;
      componentNode = instanceNode.mainComponent;

      pluginData = componentNode.getSharedPluginData(
        dataNamespace(),
        dataKey,
      );
    }

    // check the peer node inside of a larger component
    if (!pluginData) {
      let peerNode = null;
      const topInstanceNode: InstanceNode = findTopInstance(node);
      if (topInstanceNode) {
        peerNode = matchMasterPeerNode(node, topInstanceNode);
        if (peerNode) {
          pluginData = peerNode.getSharedPluginData(
            dataNamespace(),
            dataKey,
          );
        }
      }
    }
  }

  if (pluginData) {
    parsedData = JSON.parse(pluginData);
  }

  return parsedData;
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

/**
 * @description Takes a letterset (A, AA, BA) and converts it to an integer.
 *
 * @kind function
 * @name lettersToNumbers
 * @param {string} num The string of letters representing a number.
 *
 * @returns {number} The integer based on the letterset.
 */
const lettersToNumbers = (letterset: string): number => {
  let totalNumber: number = 0;
  const lettersArray: Array<string> = letterset.toUpperCase().split('');
  const numbersArray: Array<number> = [];

  // iterate through each letter and convert to a number
  lettersArray.forEach((letter) => {
    const number: number = (letter.charCodeAt(0) - 64);
    numbersArray.push(number);
  });

  // iterate the numbers and calculate the position
  numbersArray.forEach((number) => {
    totalNumber = (totalNumber * 26 + number);
  });
  return totalNumber;
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
  newPageSettings = updateNestedArray(
    newPageSettings,
    newNodeSettings,
    'layerSettings',
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

export {
  asyncForEach,
  awaitUIReadiness,
  compareArrays,
  deepCompare,
  existsInArray,
  findParentInstance,
  findTopFrame,
  findTopInstance,
  findTopComponent,
  getNodeSettings,
  getPeerPluginData,
  getRelativeIndex,
  getRelativePosition,
  hexToDecimalRgb,
  isInternal,
  isVisible,
  lettersToNumbers,
  loadFirstAvailableFontAsync,
  matchMasterPeerNode,
  numberToLetters,
  resizeGUI,
  setNodeSettings,
  toSentenceCase,
  updateArray,
  updateNestedArray,
};
