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

/** WIP
 * @description A reusable helper function to take an array and add or remove data from it
 * based on a top-level key and a defined action.
 * an action (`add` or `remove`).
 *
 * @kind function
 * @name hexToDecimalRGB
 * @param {string} key String representing the top-level area of the array to modify.
 *
 * @returns {Object} The modified array.
 * @private
 */
const hexToDecimalRgb = (hexColor: string) => {
  const rgbColor = hexRgb(hexColor);

  const r = (rgbColor.red / 255);
  const g = (rgbColor.green / 255);
  const b = (rgbColor.blue / 255);

  const decimalRgb = { r, g, b };
  return decimalRgb;
};

export {
  hexToDecimalRgb,
  updateArray,
};
