import { CONTAINER_NODE_TYPES } from './constants';
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
        layer.type !== CONTAINER_NODE_TYPES.group
        && layer.type !== CONTAINER_NODE_TYPES.frame
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
              visible: boolean,
            },
          ) => {
            if (
              innerLayer.type !== CONTAINER_NODE_TYPES.group
              && innerLayer.type !== CONTAINER_NODE_TYPES.frame
              && innerLayer.visible
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
   * @description Creates an object containing `x`, `y` coordinates, outer-edge x/y coordinates,
   * and `width` and `height` for the outside bounding area of a supplied node, keeping the
   * coordinates relative to the frame. The bounding area is the edge-to-edge surface area
   * encompassing rotation.
   *
   * @kind function
   * @name position
   *
   * @param {Object} node The node (`SceneNode`) to retrieve bounding position on.
   *
   * @returns {Object} The `x`, `y`, `xOuter`, `yOuter` coordinates, `width`, and `height`
   * of bounding area.
   */
  static getBoundingPositition(node) {
    // find out top node
    const topFrame: SceneNode = findFrame(node);

    // clone the node that will need positioning coordinates
    const newLayer: SceneNode = node.clone();

    // set the cloned node’s positioning by comparing `absoluteTransform` values between
    // the original node and the top-level frame node.
    const newTransformMatrix: [
      [number, number, number],
      [number, number, number]
    ] = [
      [
        node.absoluteTransform[0][0],
        node.absoluteTransform[0][1],
        node.absoluteTransform[0][2] - topFrame.absoluteTransform[0][2],
      ],
      [
        node.absoluteTransform[1][0],
        node.absoluteTransform[1][1],
        node.absoluteTransform[1][2] - topFrame.absoluteTransform[1][2],
      ],
    ];
    newLayer.relativeTransform = newTransformMatrix;

    // add the clone to the first level of top node; group it for further evaluation.
    // grouping a node creates a new node that is not rotated and covers the entire bounds
    // of the original node (in case it is rotated). we will use the group for the final
    // positioning coordinates
    topFrame.appendChild(newLayer);
    const newLayerGroupArray = [newLayer];
    const newLayerGroup = figma.group(newLayerGroupArray, topFrame);
    const relativePosition = getRelativePosition(newLayerGroup, topFrame);

    // set up the bounds positioning based on the group, not the original or cloned nodes
    const nodeBoundingPosition: {
      x: number,
      y: number,
      xOuter: number,
      yOuter: number,
      width: number,
      height: number,
    } = {
      x: relativePosition.x,
      y: relativePosition.y,
      xOuter: relativePosition.x + newLayerGroup.width,
      yOuter: relativePosition.y + newLayerGroup.height,
      width: newLayerGroup.width,
      height: newLayerGroup.height,
    };

    // remove the cloned node (this will also remove the group)
    newLayer.remove();

    // return the coordinates
    return nodeBoundingPosition;
  }

  /**
   * @description Creates an object containing `x`, `y` coordinates and `width` and `height`
   * an entire selection, keeping the coordinates relative to the frame, ignoring if some
   * items are grouped inside other layers.
   *
   * @kind function
   * @name position
   *
   * @returns {Object} The `x`, `y` coordinates and `width` and `height` of an entire selection.
   */
  position() {
    const result: {
      status: 'error' | 'success',
      messages: {
        toast: string,
        log: string,
      },
      payload: any,
    } = {
      status: null,
      messages: {
        toast: null,
        log: null,
      },
      payload: null,
    };

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
    let xOuter: number = 0;
    let yOuter: number = 0;

    // a flat selection from .all() is not needed for the outer position/dimensions
    // of an entire selection
    const selection = this.array;

    // check for top frames
    let allHaveTopFrames = true;
    selection.forEach((layer) => {
      const topFrame = findFrame(layer);
      if (!topFrame) {
        allHaveTopFrames = false;
      }
    });

    if (!allHaveTopFrames) {
      result.status = 'error';
      result.messages.log = 'One or more nodes not inside a frame';
      result.messages.toast = 'All layers must be inside a frame';
      return result;
    }

    // iterate through the selected layers and update the frame inner `x`/`y` values and
    // the outer `x`/`y` values
    selection.forEach((layer) => {
      const nodeBoundingPosition = Crawler.getBoundingPositition(layer);

      // set upper-left x
      if (
        (!thePosition.x)
        || (thePosition.x > nodeBoundingPosition.x)
      ) {
        thePosition.x = nodeBoundingPosition.x;
      }

      // set xOuter
      if (nodeBoundingPosition.xOuter > xOuter) {
        xOuter = nodeBoundingPosition.xOuter;
      }

      // set upper-left y
      if (
        (!thePosition.y)
        || (thePosition.y > nodeBoundingPosition.y)
      ) {
        thePosition.y = nodeBoundingPosition.y;
      }

      // set yOuter
      if (nodeBoundingPosition.yOuter > yOuter) {
        yOuter = nodeBoundingPosition.yOuter;
      }
    });

    // calculate the full `width`/`height` based on the inner and outer `x`/`y` values
    const width: number = xOuter - thePosition.x;
    const height: number = yOuter - thePosition.y;

    // set the new `width`/`height` values
    thePosition.width = width;
    thePosition.height = height;

    // set the payload and deliver
    result.status = 'success';
    result.messages.log = 'Selection position calculated';
    result.payload = thePosition;
    return result;
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
    const result: {
      status: 'error' | 'success',
      messages: {
        toast: string,
        log: string,
      },
      payload: any,
    } = {
      status: null,
      messages: {
        toast: null,
        log: null,
      },
      payload: null,
    };

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

    // a flat selection from .all() is not needed for the outer position/dimensions
    // of an entire selection
    const selection = this.array;

    // set the layers to a default for comparisons
    const firstIndex: 0 = 0;
    let layerA = selection[firstIndex];
    let layerB = selection[firstIndex];

    const layerATopFrame = findFrame(layerA);
    const layerBTopFrame = findFrame(layerB);

    if (!layerATopFrame || !layerBTopFrame) {
      result.status = 'error';
      result.messages.log = 'One or more nodes not inside a frame';
      result.messages.toast = 'All layers must be inside a frame';
      return result;
    }

    let layerAPosition = Crawler.getBoundingPositition(layerA);
    let layerBPosition = Crawler.getBoundingPositition(layerB);

    // assume the gap orientation is vertical
    let horizontalGap = false;

    // find left-most (`layerA`) and right-most (`layerB`) layers
    selection.forEach((layer) => {
      const layerPosition = Crawler.getBoundingPositition(layer);

      if (layerPosition.x < layerAPosition.x) {
        layerA = layer;
        layerAPosition = Crawler.getBoundingPositition(layerA);
      }

      if (layerPosition.x > layerBPosition.x) {
        layerB = layer;
        layerBPosition = Crawler.getBoundingPositition(layerB);
      }
    });

    if (layerA && layerB) {
      let leftEdgeX = null; // lowest x within gap
      let rightEdgeX = null; // highest x within gap
      let topEdgeY = null;
      let bottomEdgeY = null;
      let positionHeight = null;

      // make sure the layers are not overlapped (a gap exists)
      if ((layerAPosition.x + layerAPosition.width) < layerBPosition.x) {
        // set the left/right edges of the gap
        leftEdgeX = layerAPosition.x + layerAPosition.width; // lowest x within gap
        rightEdgeX = layerBPosition.x; // highest x within gap

        const layerATopY = layerAPosition.y;
        const layerABottomY = layerAPosition.y + layerAPosition.height;
        const layerBTopY = layerBPosition.y;
        const layerBBottomY = layerBPosition.y + layerBPosition.height;

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
        const layerPosition = Crawler.getBoundingPositition(layer);

        if (layerPosition.y < layerAPosition.y) {
          layerA = layer;
          layerAPosition = Crawler.getBoundingPositition(layerA);
        }

        if (layerPosition.y > layerBPosition.y) {
          layerB = layer;
          layerBPosition = Crawler.getBoundingPositition(layerB);
        }
      });

      let topEdgeY = null; // lowest y within gap
      let bottomEdgeY = null; // highest y within gap
      let leftEdgeX = null;
      let rightEdgeX = null;
      let positionWidth = null;

      // make sure the layers are not overlapped (a gap exists)
      if ((layerAPosition.y + layerAPosition.height) < layerBPosition.y) {
        // set the top/bottom edges of the gap
        topEdgeY = layerAPosition.y + layerAPosition.height; // lowest y within gap
        bottomEdgeY = layerBPosition.y; // highest y within gap

        // set initial layer values for comparison
        const layerALeftX = layerAPosition.x;
        const layerARightX = layerAPosition.x + layerAPosition.width;
        const layerBLeftX = layerBPosition.x;
        const layerBRightX = layerBPosition.x + layerBPosition.width;

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

    // return a successful result
    result.status = 'success';

    // no gap exists
    if (!thePosition.x) {
      result.messages.log = 'A gap positioning was not found';
      return result;
    }

    // set the payload
    result.messages.log = 'Gap positioning calculated';
    result.payload = thePosition;
    return result;
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
    const result: {
      status: 'error' | 'success',
      messages: {
        toast: string,
        log: string,
      },
      payload: any,
    } = {
      status: null,
      messages: {
        toast: null,
        log: null,
      },
      payload: null,
    };

    // use `gapPosition` to first ensure that the items do actually overlap
    const gapPositionResult = this.gapPosition();

    // if items do not overlap, cannot create an `overlapPosition`
    if (gapPositionResult.status === 'success' && gapPositionResult.payload) {
      result.status = 'error';
      result.messages.log = 'Gap positioning was found; cannot continue';
      return result;
    }

    // set the selection
    const selection = this.array;

    // set the layers to a default for comparisons
    const firstIndex: 0 = 0;
    let layerA = selection[firstIndex];
    let layerB = selection[selection.length - 1];

    const layerATopFrame = findFrame(layerA);
    const layerBTopFrame = findFrame(layerB);

    if (!layerATopFrame || !layerBTopFrame) {
      result.status = 'error';
      result.messages.log = 'One or more nodes not inside a frame';
      result.messages.toast = 'All layers must be inside a frame';
      return result;
    }

    let layerAPosition = Crawler.getBoundingPositition(layerA);
    let layerBPosition = Crawler.getBoundingPositition(layerB);

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
        layerBPosition = Crawler.getBoundingPositition(layerB);
      }

      if (layerIndex < layerAIndex) {
        layerA = layer;
        layerAIndex = layerIndex;
        layerAPosition = Crawler.getBoundingPositition(layerA);
      }
    });

    // we need a dominant layer to orient positioning;
    // if both layers are exactly the same index, we cannot assume dominance.
    // this should not happen, but layers might be selected from multiple artboards.
    if (layerAIndex === layerBIndex) {
      result.status = 'error';
      result.messages.log = 'Layers are the same index';
      result.messages.toast = 'Select layers inside the same frame';
      return result;
    }

    // -------- set positions - essentially defining rectangles in the overapped spaces
    // between the two layers
    // top
    const topWidth = layerBPosition.width;
    const topHeight = layerBPosition.y - layerAPosition.y;
    const topX = layerBPosition.x;
    const topY = layerAPosition.y;

    // bottom
    const bottomWidth = layerBPosition.width;
    const bottomHeight = layerAPosition.height - topHeight - layerBPosition.height;
    const bottomX = layerBPosition.x;
    const bottomY = layerAPosition.y + topHeight + layerBPosition.height;

    // left
    const leftWidth = layerBPosition.x - layerAPosition.x;
    const leftHeight = layerBPosition.height;
    const leftX = layerAPosition.x;
    const leftY = layerBPosition.y;

    // right
    const rightWidth = layerAPosition.width - layerBPosition.width - leftWidth;
    const rightHeight = layerBPosition.height;
    const rightX = layerBPosition.x + layerBPosition.width;
    const rightY = layerBPosition.y;

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

    // set the payload and deliver
    result.status = 'success';
    result.messages.log = 'Overlap positions calculated';
    result.payload = thePositions;
    return result;
  }
}
