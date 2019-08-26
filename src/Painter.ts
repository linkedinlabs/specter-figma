import { hexToDecimalRgb } from './Tools';
import {
  COLORS,
  FRAME_TYPES,
  PLUGIN_IDENTIFIER,
  PLUGIN_NAME,
} from './constants';

// --- private functions for drawing/positioning annotation elements in the Figma file

/**
 * @description Builds the rectangle shape styled as a bounding box.
 *
 * @kind function
 * @name buildBoundingBox
 * @param {Object} position The frame coordinates (`x`, `y`, `width`, and `height`) for the box.
 * @param {Object} containerGroup The container group to draw within.
 * @returns {Object} The Sketch ShapePath object for the box.
 * @private
 */
const buildBoundingBox = (position, containerGroup?) => {
  const colorHex = COLORS.style;
  const colorOpactiy = '4d'; // 30% opacity

  console.log('hello from build');
  console.log(position);

  const rect = figma.createRectangle();
  const rectRgb = hexToDecimalRgb(colorHex);

  rect.x = position.x;
  rect.y = position.y;

  rect.resize(position.width, position.height)
  rect.fills = [{
    type: 'SOLID',
    color: { r: rectRgb.r, g: rectRgb.g, b: rectRgb.b },
    opacity: 0.3,
  }];
  return rect;
  // figma.currentPage.appendChild(rect);
  // nodes.push(rect)

  // find container position, relative to artboard
  // const relativeGroupFrame = getPositionOnArtboard(containerGroup.sketchObject);

  // // set x, y relative to container group and artboard
  // const placementX = position.x - relativeGroupFrame.x;
  // const placementY = position.y - relativeGroupFrame.y;

  // // build the rounded rectangle
  // const boundingBox = new ShapePath({
  //   position: new Rectangle(placementX, placementY, position.width, position.height),
  //   name: 'Bounding Box',
  //   parent: containerGroup,
  //   style: {
  //     borders: [{
  //       enabled: false,
  //       thickness: 0,
  //     }],
  //     fills: [`${colorHex}${colorOpactiy}`], // i.e. #ff6655
  //   },
  // });

  // return boundingBox;
};

/** WIP
 * @description Takes a string representing the type of element getting painted and
 * returns the name of the group used for that element.
 *
 * @kind function
 * @name findFrame
 * @param {string} elementType A string representing the type of element getting painted.
 *
 * @returns {string} The name of the group getting painted.
 * @private
 */
const findFrame = (layer: any) => {
  let { parent } = layer;

  // loop through each parent and adjust the coordinates
  if (parent) {
    while (parent.type !== FRAME_TYPES.main) {
      parent = parent.parent; // eslint-disable-line prefer-destructuring
    }
  }
  return parent;
};

/**
 * @description Takes a string representing the type of element getting painted and
 * returns the name of the group used for that element.
 *
 * @kind function
 * @name setGroupName
 * @param {string} elementType A string representing the type of element getting painted.
 *
 * @returns {string} The name of the group getting painted.
 * @private
 */
const setGroupName = (elementType: string) => {
  let groupName = null;
  switch (elementType) {
    case 'boundingBox':
      groupName = 'Bounding Boxes';
      break;
    case 'component':
    case 'custom':
      groupName = 'Component Annotations';
      break;
    case 'dimension':
      groupName = 'Dimension Annotations';
      break;
    case 'spacing':
      groupName = 'Spacing Annotations';
      break;
    case 'style':
      groupName = 'Foundation Annotations';
      break;
    default:
      groupName = 'Component Annotations';
  }
  return groupName;
};

/**
 * @description Takes a string representing the type of element getting painted and
 * returns the key used in document settings to represent data linked to the element.
 *
 * @kind function
 * @name setGroupKey
 * @param {string} elementType A string representing the type of element getting painted.
 *
 * @returns {string} The key representing the type of element getting painted.
 * @private
 */
const setGroupKey = (elementType: string) => {
  let groupKey = null;
  switch (elementType) {
    case 'boundingBox':
      groupKey = 'boundingInnerGroupId';
      break;
    case 'component':
    case 'custom':
      groupKey = 'componentInnerGroupId';
      break;
    case 'dimension':
      groupKey = 'dimensionInnerGroupId';
      break;
    case 'spacing':
      groupKey = 'spacingInnerGroupId';
      break;
    case 'style':
      groupKey = 'styleInnerGroupId';
      break;
    default:
      groupKey = 'componentInnerGroupId';
  }
  return groupKey;
};

// --- main Painter class function
/**
 * @description A class to add elements to the Sketch file.
 *
 * @class
 * @name Painter
 *
 * @constructor
 *
 * @property layer The layer in the Sketch file that we want to annotate or modify.
 */
export default class Painter {
  layer: any;
  frame: any;
  page: any;
  constructor({ for: layer, in: page }) {
    this.layer = layer;
    this.frame = findFrame(this.layer);
    this.page = page;
  }

  /**
   * @description Adds a semi-transparent rectangle to a specific artboard based on the parameters
   * received in the `frame` object.
   *
   * @kind function
   * @name addBoundingBox
   * @param {Object} position The position coordinates (`x`, `y`, `width`, and `height`) for the box.
   * @returns {Object} A result object container success/error status and log/toast messages.
   */
  addBoundingBox(position) {
    const result = {
      status: null,
      messages: {
        toast: null,
        log: null,
      },
    };

    // create or locate the container group
    // const { innerContainerGroup } = setContainerGroups(
    //   this.frame,
    //   this.page,
    //   'boundingBox',
    // );

    // draw the bounding box
    // const boundingBox = buildBoundingBox(position, innerContainerGroup);
    // const innerContainerGroup = figma.createFrame()
    // innerContainerGroup.name = 'yolo';
    // this.frame.appendChild(innerContainerGroup);
    const boundingBox = buildBoundingBox(position);

    const innerContainerGroup = figma.group([boundingBox], this.frame);
    innerContainerGroup.x = position.x;
    innerContainerGroup.y = position.y;
    innerContainerGroup.name = 'yolo';

    innerContainerGroup.appendChild(boundingBox);
    // innerContainerGroup.appendChild(boundingBox);

    if (!boundingBox) {
      result.status = 'error';
      result.messages.log = 'Failed to draw the bounding box for a selection';
      result.messages.toast = 'Hmm… an error occured drawing that bounding box 😬';

      return result;
    }

    result.status = 'success';
    result.messages.log = `Bounding box drawn on “${this.frame.name}”`;
    return result;
  }
}
