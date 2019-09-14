import { FRAME_TYPES } from './constants';

/**
 * @description A class to handle traversing an array of selected items and return useful items
 * (child layers, first in selection, layer position, dimensions and position of layer gaps
 * and overlapping layer negative space).
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

  /**
   * @description Looks into the selection array for any groups and pulls out individual layers,
   * effectively flattening the selection.
   *
   * @kind function
   * @name all
   * @returns {Object} All items (including children) individual in an updated array.
   */
  all() {
    const initialSelection = this.array;
    const flatSelection = [];

    // iterate through initial selection
    initialSelection.forEach((layer: any) => {
      if (
        layer.type !== FRAME_TYPES.group
        && layer.type !== FRAME_TYPES.main
      ) {
        // non-frame or -group layers get added to the final selection
        flatSelection.push(layer);
      } else {
        // +++ frames and groups are checked for child layers

        // set initial holding array and add first level of children
        let innerLayers = [];
        layer.children.forEach(child => innerLayers.push(child));

        /**
         * @description Iterates through `innerLayers`, adding normal layers to the `flatSelection`
         * array, while adding any additional children layers into the `innerLayers` array.
         *
         * @kind function
         * @name iterateKnownChildren
         * @private
         */
        const iterateKnownChildren = (): void => {
          // iterate through known child layers in `innerLayers`,
          // adding more children to the array as they are found in descendent layers
          innerLayers.forEach((
            innerLayer: {
              children: any,
              id: string,
              type: string,
            },
          ) => {
            if (
              innerLayer.type !== FRAME_TYPES.group
              && innerLayer.type !== FRAME_TYPES.main
            ) {
              // non-frame or -group layers get added to the final selection
              flatSelection.push(innerLayer);
            } else {
              innerLayer.children.forEach(child => innerLayers.push(child));
            }

            // update the overall list of child layers, removing the layer that was just examined.
            // this array should eventually be empty, breaking the `while` loop
            const innerLayerIndex = innerLayers.findIndex(
              foundInnerLayer => (foundInnerLayer.id === innerLayer.id),
            );
            innerLayers = [
              ...innerLayers.slice(0, innerLayerIndex),
              ...innerLayers.slice(innerLayerIndex + 1),
            ];
          });
        };

        // loop through the `innerLayers` array as long as it is not empty
        while (innerLayers.length > 0) {
          iterateKnownChildren();
        }
      }
    });
    return flatSelection;
  }

  /**
   * @description Creates an object containing `x`, `y` coordinates and `width` and `height`
   * an entire selection, keeping the coordinates relative to the frame, ignoring if some
   * items are grouped inside other layers.
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
