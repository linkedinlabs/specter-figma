import { CONTAINER_NODE_TYPES } from './constants';
import {
  findTopFrame,
  getRelativeIndex,
  getRelativePosition,
} from './Tools';

/**
 * @description A class to handle traversing an array of selected items and return useful items
 * (child nodes, first in selection, node position, dimensions and position of node gaps
 * and overlapping node negative space).
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
   * @returns {Object} The first node item in the array.
   */
  first() {
    return this.array[0];
  }

  /**
   * @description Looks into the selection array for any groups and pulls out individual nodes,
   * effectively flattening the selection. NOTE: Component and Instance types are included by
   * default as single nodes to allow Specter to annotate at the top-level. If they are excluded
   * (set `excludeComponents` to `true`), their children will be evaluated and components nested
   * within components will also be annotated.
   *
   * @kind function
   * @name all
   *
   * @param {boolean} excludeComponents When set to `true` (default), Component and Instance
   * type nodes will have their children evaluated for inclusion in the flattened selection.
   *
   * @returns {Object} All items (including children) individual in an updated array.
   */
  all(excludeComponents: boolean = false) {
    const initialSelection = this.array;
    const flatSelection = [];
    const excludedTypes: Array<string> = [
      CONTAINER_NODE_TYPES.group,
      CONTAINER_NODE_TYPES.frame,
    ];

    if (excludeComponents) {
      excludedTypes.push(CONTAINER_NODE_TYPES.component);
      excludedTypes.push(CONTAINER_NODE_TYPES.instance);
    }

    // iterate through initial selection
    initialSelection.forEach((node: any) => {
      if (
        excludedTypes.filter(type => type === node.type).length < 1
        && node.visible
        && !node.locked
      ) {
        // non-frame or -group nodes get added to the final selection
        flatSelection.push(node);
      } else {
        // +++ frames and groups are added for their own styles to be evaluated
        flatSelection.push(node);

        // +++ frames and groups are checked for child nodes

        // set initial holding array and add first level of children
        let innerLayers = [];
        if (node.visible && !node.locked) {
          node.children.forEach((child) => {
            if (child.visible && !node.locked) {
              innerLayers.push(child);
            }
          });
        }

        /**
         * @description Iterates through `innerLayers`, adding normal nodes to the `flatSelection`
         * array, while adding any additional children nodes into the `innerLayers` array.
         *
         * @kind function
         * @name iterateKnownChildren
         * @returns {null}
         *
         * @private
         */
        const iterateKnownChildren = (): void => {
          // iterate through known child nodes in `innerLayers`,
          // adding more children to the array as they are found in descendent nodes
          innerLayers.forEach((
            innerLayer: {
              children: any,
              id: string,
              type: string,
              visible: boolean,
              locked: boolean,
            },
          ) => {
            if (
              innerLayer.type !== CONTAINER_NODE_TYPES.group
              && innerLayer.type !== CONTAINER_NODE_TYPES.frame
              // && innerLayer.type !== CONTAINER_NODE_TYPES.component
              // && innerLayer.type !== CONTAINER_NODE_TYPES.instance
              && innerLayer.visible
              && !innerLayer.locked
            ) {
              // non-frame or -group nodes get added to the final selection
              flatSelection.push(innerLayer);
            } else if (innerLayer.visible && !innerLayer.locked) {
              // frames and groups are added for their own styles to be evaluated
              flatSelection.push(innerLayer);

              innerLayer.children.forEach((child) => {
                if (child.visible && !child.locked) {
                  innerLayers.push(child);
                }
              });
            }

            // update the overall list of child nodes, removing the node that was just examined.
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
   * @description Looks into the selection array for any groups and pulls out individual nodes,
   * effectively flattening the selection. Sorts the resulting array of nodes by `y` position
   * and then `x` if `y` values are equal. Position is determined absolutely
   * (relative to only the page).
   *
   * @kind function
   * @name allSorted
   *
   * @returns {Object} All items (including children) individual in an updated array.
   */
  allSorted() {
    // start with flattened selection of all nodes
    const nodes = this.all();
    const sortedNodes = this.sorted(nodes);
    return sortedNodes;
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
    const topFrame: FrameNode = findTopFrame(node);

    // clone the node that will need positioning coordinates
    const newNode: SceneNode = node.clone();

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
    newNode.relativeTransform = newTransformMatrix;

    // add the clone to the first level of top node; group it for further evaluation.
    // grouping a node creates a new node that is not rotated and covers the entire bounds
    // of the original node (in case it is rotated). we will use the group for the final
    // positioning coordinates
    topFrame.appendChild(newNode);
    const newNodeGroupArray = [newNode];
    const newNodeGroup = figma.group(newNodeGroupArray, topFrame);
    const relativePosition = getRelativePosition(newNodeGroup, topFrame);

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
      xOuter: relativePosition.x + newNodeGroup.width,
      yOuter: relativePosition.y + newNodeGroup.height,
      width: newNodeGroup.width,
      height: newNodeGroup.height,
    };

    // remove the cloned node (this will also remove the group)
    newNode.remove();

    // return the coordinates
    return nodeBoundingPosition;
  }

  /**
   * @description Creates an object containing `x`, `y` coordinates and `width` and `height`
   * an entire selection, keeping the coordinates relative to the frame, ignoring if some
   * items are grouped inside other nodes.
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
    selection.forEach((node) => {
      const topFrame: FrameNode = findTopFrame(node);
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

    // iterate through the selected nodes and update the frame inner `x`/`y` values and
    // the outer `x`/`y` values
    selection.forEach((node) => {
      const nodeBoundingPosition = Crawler.getBoundingPositition(node);

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
   * @description Simulates position(), but for the space between two selected nodes.
   * It keeps the coordinates relative to the artboard, ignoring if some of the items are
   * grouped inside other nodes. It also adds an orientation `horizontal` or `vertical`
   * based on the gap orientation. Assumes only 2 nodes are selected.
   *
   * @kind function
   * @name gapPosition
   * @returns {Object} The `x`, `y` coordinates, `width`, `height`, and `orientation`
   * of an entire selection. It also includes node IDs (`layerAId` and `layerBId`)
   * for the two nodes used to calculated the gap position.
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

    // set the nodes to a default for comparisons
    const firstIndex: 0 = 0;
    let nodeA = selection[firstIndex];
    let nodeB = selection[firstIndex];

    const nodeATopFrame: FrameNode = findTopFrame(nodeA);
    const nodeBTopFrame: FrameNode = findTopFrame(nodeB);

    if (!nodeATopFrame || !nodeBTopFrame) {
      result.status = 'error';
      result.messages.log = 'One or more nodes not inside a frame';
      result.messages.toast = 'All layers must be inside a frame';
      return result;
    }

    let nodeAPosition = Crawler.getBoundingPositition(nodeA);
    let nodeBPosition = Crawler.getBoundingPositition(nodeB);

    // assume the gap orientation is vertical
    let horizontalGap = false;

    // find left-most (`nodeA`) and right-most (`nodeB`) nodes
    selection.forEach((node) => {
      const nodePosition = Crawler.getBoundingPositition(node);

      if (nodePosition.x < nodeAPosition.x) {
        nodeA = node;
        nodeAPosition = Crawler.getBoundingPositition(nodeA);
      }

      if (nodePosition.x > nodeBPosition.x) {
        nodeB = node;
        nodeBPosition = Crawler.getBoundingPositition(nodeB);
      }
    });

    if (nodeA && nodeB) {
      let leftEdgeX = null; // lowest x within gap
      let rightEdgeX = null; // highest x within gap
      let topEdgeY = null;
      let bottomEdgeY = null;
      let positionHeight = null;

      // make sure the nodes are not overlapped (a gap exists)
      if ((nodeAPosition.x + nodeAPosition.width) < nodeBPosition.x) {
        // set the left/right edges of the gap
        leftEdgeX = nodeAPosition.x + nodeAPosition.width; // lowest x within gap
        rightEdgeX = nodeBPosition.x; // highest x within gap

        const nodeATopY = nodeAPosition.y;
        const nodeABottomY = nodeAPosition.y + nodeAPosition.height;
        const nodeBTopY = nodeBPosition.y;
        const nodeBBottomY = nodeBPosition.y + nodeBPosition.height;

        if (nodeBTopY >= nodeATopY) {
          // top of A is higher than top of B
          if (nodeABottomY >= nodeBTopY) {
            // top of B is higher than bottom of A
            if (nodeBBottomY >= nodeABottomY) {
              // bottom of A is higher than bottom of B
              // decision: top edge is top of B; bottom edge is bottom of A
              topEdgeY = nodeBTopY;
              bottomEdgeY = nodeABottomY;
            } else {
              // decision: top edge is top of B; bottom edge is bottom of B
              topEdgeY = nodeBTopY;
              bottomEdgeY = nodeBBottomY;
            }
          } else {
            // decision: top edge is bottom of A; bottom edge is top of B
            topEdgeY = nodeABottomY;
            bottomEdgeY = nodeBTopY;
          }
        } else if (nodeBBottomY >= nodeATopY) {
          // top of A is higher than bottom of B
          if (nodeABottomY >= nodeBBottomY) {
            // bottom of B is higher than bottom of A
            // decision: top edge is top of A; bottom edge is bottom of B
            topEdgeY = nodeATopY;
            bottomEdgeY = nodeBBottomY;
          } else {
            // decision: top edge is top of A; bottom edge is bottom of A
            topEdgeY = nodeATopY;
            bottomEdgeY = nodeABottomY;
          }
        } else {
          // decision: top edge is bottom of B; bottom edge is top of A
          topEdgeY = nodeBBottomY;
          bottomEdgeY = nodeATopY;
        }

        // set position height
        positionHeight = bottomEdgeY - topEdgeY;

        // set the final position params
        // cut final `y` in half by height to position annotation at mid-point
        thePosition.x = leftEdgeX;
        thePosition.y = topEdgeY + (positionHeight / 2);
        thePosition.width = rightEdgeX - leftEdgeX;
        thePosition.height = positionHeight;
        thePosition.layerAId = nodeA.id;
        thePosition.layerBId = nodeB.id;
      } else {
        horizontalGap = true;
      }
    }

    // the gap is horizontal (if overlap does not exist)
    if (horizontalGap) {
      // find top-most (`nodeA`) and bottom-most (`nodeB`) nodes
      selection.forEach((node) => {
        const nodePosition = Crawler.getBoundingPositition(node);

        if (nodePosition.y < nodeAPosition.y) {
          nodeA = node;
          nodeAPosition = Crawler.getBoundingPositition(nodeA);
        }

        if (nodePosition.y > nodeBPosition.y) {
          nodeB = node;
          nodeBPosition = Crawler.getBoundingPositition(nodeB);
        }
      });

      let topEdgeY = null; // lowest y within gap
      let bottomEdgeY = null; // highest y within gap
      let leftEdgeX = null;
      let rightEdgeX = null;
      let positionWidth = null;
      let positionHeight = null;

      // make sure the nodes are not overlapped (a gap exists)
      if ((nodeAPosition.y + nodeAPosition.height) < nodeBPosition.y) {
        // set the top/bottom edges of the gap
        topEdgeY = nodeAPosition.y + nodeAPosition.height; // lowest y within gap
        bottomEdgeY = nodeBPosition.y; // highest y within gap

        // set initial node values for comparison
        const nodeALeftX = nodeAPosition.x;
        const nodeARightX = nodeAPosition.x + nodeAPosition.width;
        const nodeBLeftX = nodeBPosition.x;
        const nodeBRightX = nodeBPosition.x + nodeBPosition.width;

        if (nodeBLeftX >= nodeALeftX) {
          // left-most of A is to the left of left-most of B
          if (nodeARightX >= nodeBLeftX) {
            // left-most of B is to the left of right-most of A
            if (nodeBRightX >= nodeARightX) {
              // right-most of A is to the left of right-most of B
              // decision: left-most edge is left-most of B; right-most edge is right-most of A
              leftEdgeX = nodeBLeftX;
              rightEdgeX = nodeARightX;
            } else {
              // decision: left-most edge is left-most of B; right-most edge is right-most of B
              leftEdgeX = nodeBLeftX;
              rightEdgeX = nodeBRightX;
            }
          } else {
            // decision: left-most edge is right-most of A; right-most edge is left-most of B
            leftEdgeX = nodeARightX;
            rightEdgeX = nodeBLeftX;
          }
        } else if (nodeBRightX >= nodeALeftX) {
          // left-most of A is to the left of right-most of B
          if (nodeARightX >= nodeBRightX) {
            // right-most of B is to the left of right-most of A
            // decision: left-most edge is left-most of A; right-most edge is right-most of B
            leftEdgeX = nodeALeftX;
            rightEdgeX = nodeBRightX;
          } else {
            // decision: left-most edge is left-most of A; right-most edge is right-most of A
            leftEdgeX = nodeALeftX;
            rightEdgeX = nodeARightX;
          }
        } else {
          // decision: left-most edge is right-most of B; right-most edge is left-most of A
          leftEdgeX = nodeBRightX;
          rightEdgeX = nodeALeftX;
        }

        // set position width
        positionWidth = rightEdgeX - leftEdgeX;

        // set the final position params
        // move final `x` to position annotation at mid-point
        thePosition.x = leftEdgeX + (positionWidth / 2);
        thePosition.y = topEdgeY;
        thePosition.width = positionWidth;
        thePosition.height = bottomEdgeY - topEdgeY;
        thePosition.orientation = 'horizontal';
        thePosition.layerAId = nodeA.id;
        thePosition.layerBId = nodeB.id;
      }

      // check to see if the two nodes are touching, rather than gapped or overlapped
      if ((nodeAPosition.y + nodeAPosition.height) === nodeBPosition.y) {
        // determine vertical auto-layout padding affects here
        if (
          (nodeA.type === 'FRAME' && nodeA.layoutMode !== 'NONE')
          || (nodeB.type === 'FRAME' && nodeB.layoutMode !== 'NONE')
        ) {
          const topNode = nodeA as FrameNode;
          const bottomNode = nodeB as FrameNode;

          const nodeALeftX = nodeAPosition.x + topNode.paddingLeft;
          const nodeARightX = nodeAPosition.x + nodeAPosition.width - topNode.paddingLeft;
          const nodeBLeftX = nodeBPosition.x + bottomNode.paddingLeft;
          const nodeBRightX = nodeBPosition.x
            + nodeBPosition.width - bottomNode.paddingLeft;

          if (nodeBLeftX >= nodeALeftX) {
            // left-most of A is to the left of left-most of B
            if (nodeARightX >= nodeBLeftX) {
              // left-most of B is to the left of right-most of A
              if (nodeBRightX >= nodeARightX) {
                // right-most of A is to the left of right-most of B
                // decision: left-most edge is left-most of B; right-most edge is right-most of A
                leftEdgeX = nodeBLeftX;
                rightEdgeX = nodeARightX;
              } else {
                // decision: left-most edge is left-most of B; right-most edge is right-most of B
                leftEdgeX = nodeBLeftX;
                rightEdgeX = nodeBRightX;
              }
            } else {
              // decision: left-most edge is right-most of A; right-most edge is left-most of B
              leftEdgeX = nodeARightX;
              rightEdgeX = nodeBLeftX;
            }
          } else if (nodeBRightX >= nodeALeftX) {
            // left-most of A is to the left of right-most of B
            if (nodeARightX >= nodeBRightX) {
              // right-most of B is to the left of right-most of A
              // decision: left-most edge is left-most of A; right-most edge is right-most of B
              leftEdgeX = nodeALeftX;
              rightEdgeX = nodeBRightX;
            } else {
              // decision: left-most edge is left-most of A; right-most edge is right-most of A
              leftEdgeX = nodeALeftX;
              rightEdgeX = nodeARightX;
            }
          } else {
            // decision: left-most edge is right-most of B; right-most edge is left-most of A
            leftEdgeX = nodeBRightX;
            rightEdgeX = nodeALeftX;
          }

          positionWidth = rightEdgeX - leftEdgeX;

          // set a `thePosition` in the padded area to simulate the gap
          // move final `x` to position annotation at mid-point
          thePosition.x = leftEdgeX + (positionWidth / 2);
          thePosition.y = nodeAPosition.y + nodeAPosition.height - topNode.paddingTop;
          thePosition.width = positionWidth;
          thePosition.height = topNode.paddingTop + bottomNode.paddingTop;
          thePosition.orientation = 'horizontal';
          thePosition.layerAId = nodeA.id;
          thePosition.layerBId = nodeB.id;
        }
      } else if ((nodeAPosition.x + nodeAPosition.width) === nodeBPosition.x) {
        // determine horizontal auto-layout padding affects here
        if (
          (nodeA.type === 'FRAME' && nodeA.layoutMode !== 'NONE')
          || (nodeB.type === 'FRAME' && nodeB.layoutMode !== 'NONE')
        ) {
          const leftNode = nodeA as FrameNode;
          const rightNode = nodeB as FrameNode;

          // set the left/right edges of the gap
          leftEdgeX = nodeAPosition.x + nodeAPosition.width; // lowest x within gap
          rightEdgeX = nodeBPosition.x; // highest x within gap

          const nodeATopY = nodeAPosition.y + leftNode.paddingTop;
          const nodeABottomY = nodeAPosition.y + nodeAPosition.height - leftNode.paddingTop;
          const nodeBTopY = nodeBPosition.y + rightNode.paddingTop;
          const nodeBBottomY = nodeBPosition.y
            + nodeBPosition.height - rightNode.paddingTop;

          if (nodeBTopY >= nodeATopY) {
            // top of A is higher than top of B
            if (nodeABottomY >= nodeBTopY) {
              // top of B is higher than bottom of A
              if (nodeBBottomY >= nodeABottomY) {
                // bottom of A is higher than bottom of B
                // decision: top edge is top of B; bottom edge is bottom of A
                topEdgeY = nodeBTopY;
                bottomEdgeY = nodeABottomY;
              } else {
                // decision: top edge is top of B; bottom edge is bottom of B
                topEdgeY = nodeBTopY;
                bottomEdgeY = nodeBBottomY;
              }
            } else {
              // decision: top edge is bottom of A; bottom edge is top of B
              topEdgeY = nodeABottomY;
              bottomEdgeY = nodeBTopY;
            }
          } else if (nodeBBottomY >= nodeATopY) {
            // top of A is higher than bottom of B
            if (nodeABottomY >= nodeBBottomY) {
              // bottom of B is higher than bottom of A
              // decision: top edge is top of A; bottom edge is bottom of B
              topEdgeY = nodeATopY;
              bottomEdgeY = nodeBBottomY;
            } else {
              // decision: top edge is top of A; bottom edge is bottom of A
              topEdgeY = nodeATopY;
              bottomEdgeY = nodeABottomY;
            }
          } else {
            // decision: top edge is bottom of B; bottom edge is top of A
            topEdgeY = nodeBBottomY;
            bottomEdgeY = nodeATopY;
          }

          // set position height
          positionHeight = bottomEdgeY - topEdgeY;

          // set a `thePosition` in the padded area to simulate the gap
          // move final `y` to position annotation at mid-point
          thePosition.x = leftEdgeX - leftNode.paddingLeft;
          thePosition.y = topEdgeY + (positionHeight / 2);
          thePosition.width = rightEdgeX - leftEdgeX
            + leftNode.paddingLeft + rightNode.paddingLeft;
          thePosition.height = positionHeight;
          thePosition.orientation = 'vertical';
          thePosition.layerAId = nodeA.id;
          thePosition.layerBId = nodeB.id;
        }
      }
    }

    // return a successful result
    result.status = 'success';

    // no gap exists
    if (!thePosition.x || (thePosition.height <= 0) || (thePosition.width <= 0)) {
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
   * selected nodes. It keeps the coordinates relative to the artboard, ignoring
   * if some of the items are grouped inside other nodes. It also adds an orientation
   * `horizontal` or `vertical` based on the gap orientation. Assumes only 2 nodes
   * are selected.
   *
   * @kind function
   * @name overlapPositions
   * @returns {Object} The `top`, `bottom`, `right`, and `left` positions. Each position
   * contains `x`, `y` coordinates, `width`, `height`, and `orientation`.
   * The object also includes node IDs (`layerAId` and `layerBId`)
   * for the two nodes used to calculated the overlapped areas.
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

    // set the nodes to a default for comparisons
    const firstIndex: 0 = 0;
    let nodeA = selection[firstIndex];
    let nodeB = selection[selection.length - 1];

    const nodeATopFrame: FrameNode = findTopFrame(nodeA);
    const nodeBTopFrame: FrameNode = findTopFrame(nodeB);

    if (!nodeATopFrame || !nodeBTopFrame) {
      result.status = 'error';
      result.messages.log = 'One or more nodes not inside a frame';
      result.messages.toast = 'All nodes must be inside a frame';
      return result;
    }

    let nodeAPosition = Crawler.getBoundingPositition(nodeA);
    let nodeBPosition = Crawler.getBoundingPositition(nodeB);

    // find bottom (`nodeA`) and top (`nodeB`) nodes
    let nodeAIndex = getRelativeIndex(nodeA);
    let nodeBIndex = getRelativeIndex(nodeB);

    // set the bottom node to `nodeA` and the top to `nodeB`
    // if `nodeB` is currently the bottom, we have to flip them
    selection.forEach((node) => {
      const nodeIndex = getRelativeIndex(node);

      if (nodeIndex > nodeBIndex) {
        nodeB = node;
        nodeBIndex = nodeIndex;
        nodeBPosition = Crawler.getBoundingPositition(nodeB);
      }

      if (nodeIndex < nodeAIndex) {
        nodeA = node;
        nodeAIndex = nodeIndex;
        nodeAPosition = Crawler.getBoundingPositition(nodeA);
      }
    });

    // we need a dominant node to orient positioning;
    // if both nodes are exactly the same index, we cannot assume dominance.
    // this should not happen, but nodes might be selected from multiple artboards.
    if (nodeAIndex === nodeBIndex) {
      result.status = 'error';
      result.messages.log = 'Nodes are the same index';
      result.messages.toast = 'Select layers inside the same frame';
      return result;
    }

    // -------- set positions - essentially defining rectangles in the overapped spaces
    // between the two nodes
    // top
    const topWidth = nodeBPosition.width;
    const topHeight = nodeBPosition.y - nodeAPosition.y;
    const topX = nodeBPosition.x;
    const topY = nodeAPosition.y;

    // bottom
    const bottomWidth = nodeBPosition.width;
    const bottomHeight = nodeAPosition.height - topHeight - nodeBPosition.height;
    const bottomX = nodeBPosition.x;
    const bottomY = nodeAPosition.y + topHeight + nodeBPosition.height;

    // left
    const leftWidth = nodeBPosition.x - nodeAPosition.x;
    const leftHeight = nodeBPosition.height;
    const leftX = nodeAPosition.x;
    const leftY = nodeBPosition.y;

    // right
    const rightWidth = nodeAPosition.width - nodeBPosition.width - leftWidth;
    const rightHeight = nodeBPosition.height;
    const rightX = nodeBPosition.x + nodeBPosition.width;
    const rightY = nodeBPosition.y;

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
      layerAId: nodeA.id,
      layerBId: nodeB.id,
    };

    // set the payload and deliver
    result.status = 'success';
    result.messages.log = 'Overlap positions calculated';
    result.payload = thePositions;
    return result;
  }

  /**
   * @description Creates four separate positions for the spaces around an auto-layout
   * node that contains padding. It keeps the coordinates relative to the artboard.
   * It also adds an orientation `horizontal` or `vertical` based on the padding orientation.
   * Assumes only 1 node is selected.
   *
   * @kind function
   * @name paddingPositions
   *
   * @returns {Object} The `top`, `bottom`, `right`, and `left` positions. Each position
   * contains `x`, `y` coordinates, `width`, `height`, and `orientation`. The object also
   * includes the node ID (`layerId`) for the node evaluated.
   */
  paddingPositions() {
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

    // set the node
    const node: FrameNode = this.first() as FrameNode;

    const nodeTopFrame: FrameNode = findTopFrame(node);

    if (!nodeTopFrame) {
      result.status = 'error';
      result.messages.log = 'Node not inside a frame';
      result.messages.toast = 'The layer must be inside a frame';
      return result;
    }

    const nodePosition = Crawler.getBoundingPositition(node);

    // -------- set positions - essentially defining rectangles in the padded spaces
    // top
    const topWidth = nodePosition.width - (node.paddingLeft + node.paddingRight);
    const topHeight = node.paddingTop;
    const topX = nodePosition.x + node.paddingLeft;
    const topY = nodePosition.y;

    // bottom
    const bottomWidth = topWidth;
    const bottomHeight = topHeight;
    const bottomX = topX;
    const bottomY = nodePosition.y + nodePosition.height - topHeight;

    // left
    const leftWidth = node.paddingLeft;
    const leftHeight = nodePosition.height - topHeight - bottomHeight;
    const leftX = nodePosition.x;
    const leftY = nodePosition.y + topHeight;

    // right
    const rightWidth = leftWidth;
    const rightHeight = leftHeight;
    const rightX = topX + topWidth;
    const rightY = leftY;

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
      layerId: string,
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
      layerId: node.id,
    };

    // set the payload and deliver
    result.status = 'success';
    result.messages.log = 'Padding positions calculated';
    result.payload = thePositions;
    return result;
  }

  /**
   * @description Sorts an array of nodes by `y` position and then `x` if `y` values are equal.
   * Position is determined absolutely (relative to only the page).
   *
   * @kind function
   * @name sorted
   *
   * @param {Array} nodes Array of nodes to sort by position.
   *
   * @returns {Object} All items (including children) individual in an updated array.
   */
  sorted(nodes?: Array<SceneNode>) {
    // sort by `y` position and then `x` if `y` values are equal
    const sortByPosition = (nodeA, nodeB) => {
      const aPos = { x: nodeA.absoluteTransform[0][2], y: nodeA.absoluteTransform[1][2] };
      const bPos = { x: nodeB.absoluteTransform[0][2], y: nodeB.absoluteTransform[1][2] };

      if (aPos.y === bPos.y) {
        return aPos.x - bPos.x;
      }
      return aPos.y - bPos.y;
    };

    // set up a sortable array without a read-only reference
    const nodesToSort = [];
    if (nodes && nodes.length > 0) {
      nodes.forEach(node => nodesToSort.push(node));
    } else {
      this.array.forEach(node => nodesToSort.push(node));
    }

    const sortedNodes: Array<SceneNode> = nodesToSort.sort(sortByPosition);
    return sortedNodes;
  }

  /**
   * @description Looks into the selection array and returns the unique top-level frames
   * within the selection. `PAGE` is not returned as a top-level frame, so nodes not
   * placed inside a top-level frame are ignored.
   *
   * @kind function
   * @name topFrames
   *
   * @returns {Array} All top-level frame nodes.
   */
  topFrames() {
    const topFrameNodes: Array<FrameNode> = [];
    const nodes = this.array;
    nodes.forEach((node: BaseNode) => {
      const topFrame: FrameNode = findTopFrame(node);

      let topFrameExists: boolean = false;
      topFrameNodes.forEach((existingTopFrame: FrameNode) => {
        if (existingTopFrame.id === topFrame.id) {
          topFrameExists = true;
        }
      });

      if (!topFrameExists) {
        topFrameNodes.push(topFrame);
      }
    });

    return topFrameNodes;
  }

  /**
   * @description Takes a single node and finds its corresponding top-level frame (if it
   * is placed inside one). `PAGE` is not returned as a top-level frame, so nodes not
   * placed inside a top-level frame are ignored.
   *
   * @kind function
   * @name topFrames
   *
   * @returns {Array} All top-level frame nodes.
   */
  topFrame() {
    const node = this.first();
    const topFrame: FrameNode = findTopFrame(node);

    return topFrame;
  }
}
