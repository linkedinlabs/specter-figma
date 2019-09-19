import {
  FRAME_TYPES,
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
 * @param {string} key String representing the top-level area of the array to modify.
 * @param {Object} item Object containing the new bit of data to add or
 * remove (must include an `id` string for comparison).
 * @param {Array} array The array to be modified.
 * @param {string} action Constant string representing the action to take (`add` or `remove`).
 * @returns {Object} The modified array.
 * @private
 */
const updateArray = (
  key: string,
  item: any,
  array: Array<any>,
  action: string = 'add',
) => {
  const updatedArray = array;

  if (action === 'add') {
    if (!updatedArray[key]) {
      updatedArray[key] = [];
    }

    updatedArray[key].push(item);
  }

  if (action === 'remove') {
    let updatedItems = null;
    // find the items updatedArray index of the item to remove
    const itemIndex = updatedArray[key].findIndex(foundItem => (foundItem.id === item.id));

    updatedItems = [
      ...updatedArray[key].slice(0, itemIndex),
      ...updatedArray[key].slice(itemIndex + 1),
    ];

    updatedArray[key] = updatedItems;
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
const hexToDecimalRgb = (hexColor: string) => {
  const rgbColor = hexRgb(hexColor);

  const r = (rgbColor.red / 255);
  const g = (rgbColor.green / 255);
  const b = (rgbColor.blue / 255);

  const decimalRgb = { r, g, b };
  return decimalRgb;
};

/**
 * @description Takes a layer object and traverses parent relationships until the top-level
 * `FRAME_TYPES.main` layer is found. Returns the frame layer.
 *
 * @kind function
 * @name findFrame
 * @param {Object} layer A Figma layer object.
 *
 * @returns {Object} The top-level `FRAME_TYPES.main` layer.
 */
const findFrame = (layer: any) => {
  let { parent } = layer;

  // loop through each parent and adjust the coordinates
  if (parent) {
    while (parent.type !== FRAME_TYPES.main) {
      parent = parent.parent;
    }
  }
  return parent;
};

/** WIP
 * @description Takes a layer object and traverses parent relationships until the top-level
 * `FRAME_TYPES.main` layer is found. Returns the frame layer.
 *
 * @kind function
 * @name getLayerSettings
 * @param {Object} layer A Figma layer object.
 *
 * @returns {Object} The top-level `FRAME_TYPES.main` layer.
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

/** WIP
 * @description Takes a layer object and traverses parent relationships until the top-level
 * `FRAME_TYPES.main` layer is found. Returns the frame layer.
 *
 * @kind function
 * @name setLayerSettings
 * @param {Object} layer A Figma layer object.
 *
 * @returns {Object} The top-level `FRAME_TYPES.main` layer.
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

/** WIP
 * @description Enables the plugin GUI within Figma.
 *
 * @kind function
 * @name resizeGUI
 *
 * @returns {null} Shows a Toast in the UI if nothing is selected.
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

export {
  findFrame,
  getLayerSettings,
  hexToDecimalRgb,
  resizeGUI,
  setLayerSettings,
  updateArray,
};
