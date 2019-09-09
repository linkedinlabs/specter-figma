// import { FRAME_TYPES } from './constants';

/** WIP
 * @description A class to handle traversing an array of selected items and return useful items
 * (parent layer, frame, page, etc). It will also find items based on ID (or timestamp).
 *
 * @class
 * @name Crawler
 *
 * @constructor
 *
 * @property selectionArray The array of selected items.
 */
export default class Crawler {
  array: Array<any>;
  constructor({ for: selectionArray }) {
    this.array = selectionArray;
  }

  /**
   * @description Returns the first item in the array.
   *
   * @kind function
   * @name first
   * @returns {Object} The first layer item in the array.
   */
  first() {
    return this.array[0];
  }

  /** WIP
   * @description Uses `setArray` to ensure the selection array is a javascript array. Also
   * looks into the selection for any groups and pulls out individual layers.
   *
   * @kind function
   * @name all
   * @returns {Object} All items in the array as a javascript array.
   */
  all() {
    return this.array;
    // const initialSelection = setArray(this.array);
    // const flatSelection = [];
    // initialSelection.forEach((layer) => {
    //   if (
    //     fromNative(layer).type === 'Group'
    //     || fromNative(layer).type === 'Artboard'
    //   ) {
    //     const innerLayers = layer.children();
    //     innerLayers.forEach((innerLayer) => {
    //       // .children() includes the outer layer group, so we want to exclude it
    //       // from our flattened selection
    //       if (
    //         fromNative(innerLayer).type !== 'Group'
    //         && fromNative(innerLayer).type !== 'Artboard'
    //       ) {
    //         flatSelection.push(innerLayer);
    //       }
    //     });
    //   } else {
    //     flatSelection.push(layer);
    //   }
    // });
    // return flatSelection;
  }

  /** WIP
   * @description Simulates Sketch’s position() object, but for an entire selection,
   * and keeps the coordinates relative to the frame, ignoring if some of the items
   * are grouped inside other layers.
   *
   * @kind function
   * @name position
   * @returns {Object} The `x`, `y` coordinates and `width` and `height` of an entire selection.
   */
  position() {
    const thePosition = {
      x: null,
      y: null,
      width: 0,
      height: 0,
    };

    // set some intitial outer values to compare to
    let outerX = 0;
    let outerY = 0;

    // iterate through the selected layers and update the frame inner `x`/`y` values and
    // the outer `x`/`y` values
    this.all().forEach((layer) => {
      // const layerCoordinates = getPositionOnArtboard(layer);
      const layerX = layer.x;
      const layerY = layer.y;
      const layerW = layer.width;
      const layerH = layer.height;
      const layerOuterX = layerX + layerW;
      const layerOuterY = layerY + layerH;

      // set upper-left x
      if (
        (!thePosition.x)
        || (thePosition.x > layerX)
      ) {
        thePosition.x = layerX;
      }

      // set outerX
      if (layerOuterX > outerX) {
        outerX = layerOuterX;
      }

      // set upper-left y
      if (
        (!thePosition.y)
        || (thePosition.y > layerY)
      ) {
        thePosition.y = layerY;
      }

      // set outerY
      if (layerOuterY > outerY) {
        outerY = layerOuterY;
      }
    });

    // calculate the full `width`/`height` based on the inner and outer `x`/`y` values
    const width = outerX - thePosition.x;
    const height = outerY - thePosition.y;

    // set the new `width`/`height` values
    thePosition.width = width;
    thePosition.height = height;

    return thePosition;
  }
}
