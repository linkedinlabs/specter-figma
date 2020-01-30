import { FRAME_TYPES } from './constants';
import {
  findFrame,
  getRelativeIndex,
  getRelativePosition,
} from './Tools';

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
  array: Array<SceneNode>;
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
         * @returns {null}
         *
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

          return null;
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
    const thePosition: {
      x: number,
      y: number,
      width: number,
      height: number,
    } = {
      x: null,
      y: null,
      width: 0,
      height: 0,
    };

    // set some intitial outer values to compare to
    let outerX: number = 0;
    let outerY: number = 0;

    // iterate through the selected layers and update the frame inner `x`/`y` values and
    // the outer `x`/`y` values
    this.all().forEach((layer) => {
      const topFrame = findFrame(layer);
      const relativePosition = getRelativePosition(layer, topFrame);
      const layerX: number = relativePosition.x;
      const layerY: number = relativePosition.y;
      const layerW: number = layer.width;
      const layerH: number = layer.height;
      const layerOuterX: number = layerX + layerW;
      const layerOuterY: number = layerY + layerH;

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
    const width: number = outerX - thePosition.x;
    const height: number = outerY - thePosition.y;

    // set the new `width`/`height` values
    thePosition.width = width;
    thePosition.height = height;

    return thePosition;
  }

  /**
   * @description Simulates position(), but for the space between two selected layers.
   * It keeps the coordinates relative to the artboard, ignoring if some of the items are
   * grouped inside other layers. It also adds an orientation `horizontal` or `vertical`
   * based on the gap orientation. Assumes only 2 layers are selected.
   *
   * @kind function
   * @name gapPosition
   * @returns {Object} The `x`, `y` coordinates, `width`, `height`, and `orientation`
   * of an entire selection. It also includes layer IDs (`layerAId` and `layerBId`)
   * for the two layers used to calculated the gap position.
   */
  gapPosition() {
    const thePosition: {
      x: number,
      y: number,
      width: number,
      height: number,
      orientation: 'horizontal' | 'vertical',
      layerAId: string,
      layerBId: string,
    } = {
      x: null,
      y: null,
      width: 0,
      height: 0,
      orientation: 'vertical',
      layerAId: null,
      layerBId: null,
    };

    const selection = this.array;

    // set the layers to a default for comparisons
    const firstIndex: 0 = 0;
    let layerA = selection[firstIndex];
    let layerB = selection[firstIndex];
    // assume the gap orientation is vertical
    let horizontalGap = false;

    // find left-most (`layerA`) and right-most (`layerB`) layers
    selection.forEach((layer) => {
      if (layer.x < layerA.x) {
        layerA = layer;
      }

      if (layer.x > layerB.x) {
        layerB = layer;
      }
    });

    if (layerA && layerB) {
      let leftEdgeX = null; // lowest x within gap
      let rightEdgeX = null; // highest x within gap
      let topEdgeY = null;
      let bottomEdgeY = null;
      let positionHeight = null;

      // make sure the layers are not overlapped (a gap exists)
      if ((layerA.x + layerA.width) < layerB.x) {
        // set the left/right edges of the gap
        leftEdgeX = layerA.x + layerA.width; // lowest x within gap
        rightEdgeX = layerB.x; // highest x within gap

        const layerATopY = layerA.y;
        const layerABottomY = layerA.y + layerA.height;
        const layerBTopY = layerB.y;
        const layerBBottomY = layerB.y + layerB.height;

        if (layerBTopY >= layerATopY) {
          // top of A is higher than top of B
          if (layerABottomY >= layerBTopY) {
            // top of B is higher than bottom of A
            if (layerBBottomY >= layerABottomY) {
              // bottom of A is higher than bottom of B
              // decision: top edge is top of B; bottom edge is bottom of A
              topEdgeY = layerBTopY;
              bottomEdgeY = layerABottomY;
            } else {
              // decision: top edge is top of B; bottom edge is bottom of B
              topEdgeY = layerBTopY;
              bottomEdgeY = layerBBottomY;
            }
          } else {
            // decision: top edge is bottom of A; bottom edge is top of B
            topEdgeY = layerABottomY;
            bottomEdgeY = layerBTopY;
          }
        } else if (layerBBottomY >= layerATopY) {
          // top of A is higher than bottom of B
          if (layerABottomY >= layerBBottomY) {
            // bottom of B is higher than bottom of A
            // decision: top edge is top of A; bottom edge is bottom of B
            topEdgeY = layerATopY;
            bottomEdgeY = layerBBottomY;
          } else {
            // decision: top edge is top of A; bottom edge is bottom of A
            topEdgeY = layerATopY;
            bottomEdgeY = layerABottomY;
          }
        } else {
          // decision: top edge is bottom of B; bottom edge is top of A
          topEdgeY = layerBBottomY;
          bottomEdgeY = layerATopY;
        }

        // set position height
        positionHeight = bottomEdgeY - topEdgeY;

        // set the final position params
        // cut final `y` in half by height to position annotation at mid-point
        thePosition.x = leftEdgeX;
        thePosition.y = topEdgeY + (positionHeight / 2);
        thePosition.width = rightEdgeX - leftEdgeX;
        thePosition.height = positionHeight;
        thePosition.layerAId = layerA.id;
        thePosition.layerBId = layerB.id;
      } else {
        horizontalGap = true;
      }
    }

    // the gap is horizontal (if overlap does not exist)
    if (horizontalGap) {
      // find top-most (`layerA`) and bottom-most (`layerB`) layers
      selection.forEach((layer) => {
        if (layer.y < layerA.y) {
          layerA = layer;
        }

        if (layer.y > layerB.y) {
          layerB = layer;
        }
      });

      let topEdgeY = null; // lowest y within gap
      let bottomEdgeY = null; // highest y within gap
      let leftEdgeX = null;
      let rightEdgeX = null;
      let positionWidth = null;

      // make sure the layers are not overlapped (a gap exists)
      if ((layerA.y + layerA.height) < layerB.y) {
        // set the top/bottom edges of the gap
        topEdgeY = layerA.y + layerA.height; // lowest y within gap
        bottomEdgeY = layerB.y; // highest y within gap

        // set initial layer values for comparison
        const layerALeftX = layerA.x;
        const layerARightX = layerA.x + layerA.width;
        const layerBLeftX = layerB.x;
        const layerBRightX = layerB.x + layerB.width;

        if (layerBLeftX >= layerALeftX) {
          // left-most of A is to the left of left-most of B
          if (layerARightX >= layerBLeftX) {
            // left-most of B is to the left of right-most of A
            if (layerBRightX >= layerARightX) {
              // right-most of A is to the left of right-most of B
              // decision: left-most edge is left-most of B; right-most edge is right-most of A
              leftEdgeX = layerBLeftX;
              rightEdgeX = layerARightX;
            } else {
              // decision: left-most edge is left-most of B; right-most edge is right-most of B
              leftEdgeX = layerBLeftX;
              rightEdgeX = layerBRightX;
            }
          } else {
            // decision: left-most edge is right-most of A; right-most edge is left-most of B
            leftEdgeX = layerARightX;
            rightEdgeX = layerBLeftX;
          }
        } else if (layerBRightX >= layerALeftX) {
          // left-most of A is to the left of right-most of B
          if (layerARightX >= layerBRightX) {
            // right-most of B is to the left of right-most of A
            // decision: left-most edge is left-most of A; right-most edge is right-most of B
            leftEdgeX = layerALeftX;
            rightEdgeX = layerBRightX;
          } else {
            // decision: left-most edge is left-most of A; right-most edge is right-most of A
            leftEdgeX = layerALeftX;
            rightEdgeX = layerARightX;
          }
        } else {
          // decision: left-most edge is right-most of B; right-most edge is left-most of A
          leftEdgeX = layerBRightX;
          rightEdgeX = layerALeftX;
        }

        // set position height
        positionWidth = rightEdgeX - leftEdgeX;

        // set the final position params
        // cut final `x` in half by width to position annotation at mid-point
        thePosition.x = leftEdgeX + (positionWidth / 2);
        thePosition.y = topEdgeY;
        thePosition.width = positionWidth;
        thePosition.height = bottomEdgeY - topEdgeY;
        thePosition.orientation = 'horizontal';
        thePosition.layerAId = layerA.id;
        thePosition.layerBId = layerB.id;
      }
    }

    // no gap exists
    if (!thePosition.x) {
      return null;
    }

    return thePosition;
  }

  /**
   * @description Creates four separate positions for the spaces around two overlapping
   * selected layers. It keeps the coordinates relative to the artboard, ignoring
   * if some of the items are grouped inside other layers. It also adds an orientation
   * `horizontal` or `vertical` based on the gap orientation. Assumes only 2 layers
   * are selected.
   *
   * @kind function
   * @name overlapPositions
   * @returns {Object} The `top`, `bottom`, `right`, and `left` positions. Each position
   * contains `x`, `y` coordinates, `width`, `height`, and `orientation`.
   * The object also includes layer IDs (`layerAId` and `layerBId`)
   * for the two layers used to calculated the overlapped areas.
   */
  overlapPositions() {
    // use `gapPosition` to first ensure that the items do actually overlap
    const gapPosition = this.gapPosition();

    // if items do not overlap, cannot create an `overlapPosition`
    if (gapPosition) {
      return null;
    }

    // set the selection
    const selection = this.array;

    // set the layers to a default for comparisons
    const firstIndex: 0 = 0;
    let layerA = selection[firstIndex];
    let layerB = selection[selection.length - 1];

    // find bottom (`layerA`) and top (`layerB`) layers
    let layerAIndex = getRelativeIndex(layerA);
    let layerBIndex = getRelativeIndex(layerB);

    // set the bottom layer to `layerA` and the top to `layerB`
    // if `layerB` is currently the bottom, we have to flip them
    selection.forEach((layer) => {
      const layerIndex = getRelativeIndex(layer);

      if (layerIndex > layerBIndex) {
        layerB = layer;
        layerBIndex = layerIndex;
      }

      if (layerIndex < layerAIndex) {
        layerA = layer;
        layerAIndex = layerIndex;
      }
    });

    // we need a dominant layer to orient positioning;
    // if both layers are exactly the same index, we cannot assume dominance.
    // this should not happen, but layers might be selected from multiple artboards.
    if (layerAIndex === layerBIndex) {
      return null;
    }

    // -------- set positions - essentially defining rectangles in the overapped spaces
    // between the two layers
    // top
    const topWidth = layerB.width;
    const topHeight = layerB.y - layerA.y;
    const topX = layerB.x;
    const topY = layerA.y;
    // bottom
    const bottomWidth = layerB.width;
    const bottomHeight = layerA.height - topHeight - layerB.height;
    const bottomX = layerB.x;
    const bottomY = layerA.y + topHeight + layerB.height;
    // left
    const leftWidth = layerB.x - layerA.x;
    const leftHeight = layerB.height;
    const leftX = layerA.x;
    const leftY = layerB.y;
    // right
    const rightWidth = layerA.width - layerB.width - leftWidth;
    const rightHeight = layerB.height;
    const rightX = layerB.x + layerB.width;
    const rightY = layerB.y;

    // set the positions
    const thePositions: {
      top: {
        x: number,
        y: number,
        width: number,
        height: number,
        orientation: 'horizontal' | 'vertical',
      },
      bottom: {
        x: number,
        y: number,
        width: number,
        height: number,
        orientation: 'horizontal' | 'vertical',
      },
      right: {
        x: number,
        y: number,
        width: number,
        height: number,
        orientation: 'horizontal' | 'vertical',
      },
      left: {
        x: number,
        y: number,
        width: number,
        height: number,
        orientation: 'horizontal' | 'vertical',
      },
      layerAId: string,
      layerBId: string,
    } = {
      top: {
        x: topX,
        y: topY,
        width: topWidth,
        height: topHeight,
        orientation: 'horizontal',
      },
      bottom: {
        x: bottomX,
        y: bottomY,
        width: bottomWidth,
        height: bottomHeight,
        orientation: 'horizontal',
      },
      right: {
        x: rightX,
        y: rightY,
        width: rightWidth,
        height: rightHeight,
        orientation: 'vertical',
      },
      left: {
        x: leftX,
        y: leftY,
        width: leftWidth,
        height: leftHeight,
        orientation: 'vertical',
      },
      layerAId: layerA.id,
      layerBId: layerB.id,
    };

    // deliver the result
    return thePositions;
  }
}
