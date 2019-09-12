import {
  findFrame,
  hexToDecimalRgb,
  updateArray,
} from './Tools';
import {
  COLORS,
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
 * @returns {Object} The Sketch ShapePath object for the box.
 * @private
 */
const buildBoundingBox = (position) => {
  const colorHex = COLORS.style;
  const colorOpactiy = 0.3; // 30% opacity

  // build and name the initial rectangle object
  const boundingBox = figma.createRectangle();
  boundingBox.name = 'Bounding Box';

  // position and size the rectangle
  boundingBox.x = position.x;
  boundingBox.y = position.y;
  boundingBox.resize(position.width, position.height);

  // set up the color object
  // with each color in decimal format: `{r: 1, g: 0.4, b: 0.4}`
  const color = hexToDecimalRgb(colorHex);

  // style it – set the rectangle type, color, and opacity
  boundingBox.fills = [{
    type: 'SOLID',
    color,
    opacity: colorOpactiy,
  }];

  return boundingBox;
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
    case 'topLevel':
      groupKey = 'id';
      break;
    default:
      groupKey = 'componentInnerGroupId';
  }
  return groupKey;
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
    case 'topLevel':
      groupName = `+++ ${PLUGIN_NAME} +++`;
      break;
    default:
      groupName = 'Component Annotations';
  }
  return groupName;
};

/**
 * @description Sets up the individual elements for a container group (inner or outer) and
 * adds the child layer to the group.
 *
 * @kind function
 * @name drawContainerGroup
 *
 * @param {Object} groupSettings Object containing the `name`, `position`,
 * `child` and `parent` layers, and `locked` status.
 * @returns {Object} The container group layer object.
 * @private
 */
const drawContainerGroup = (groupSettings: {
  name: string,
  position: {
    x: number,
    y: number,
  },
  parent: any,
  child: any,
  locked: boolean,
}) => {
  const {
    name,
    position,
    parent,
    child,
    locked,
  } = groupSettings;

  // set new group
  const containerGroup = figma.group([child], parent);

  // position, name, and lock new group
  containerGroup.x = position.x;
  containerGroup.y = position.y;
  containerGroup.name = name;
  containerGroup.locked = locked;

  return containerGroup;
};

/**
 * @description Builds the inner container group that holds annotations of a certain
 * `annotationType` and makes updates to the accompanying parent container group
 * settings object.
 *
 * @kind function
 * @name createContainerGroup
 * @param {Object} containerSet An instance of the parent container group’s settings object.
 * @param {string} groupType A string representing the type of element going inside the continer.
 * @param {Object} frame An object representing the top-level Figma Frame for the container group.
 * @param {Object} layer An object representing the Figma layer to be set in the container group.
 * @returns {Object} The inner container group layer object and the accompanying
 * updated parent container group settings object.
 * @private
 */
export const createContainerGroup = (
  containerSet: any,
  groupType: string,
  frame: any,
  layer: any,
) => {
  const groupName = setGroupName(groupType);
  const groupKey = setGroupKey(groupType);
  const locked = groupType === 'topLevel';

  // set up new container group layer on the frame
  const newInnerGroup = drawContainerGroup({
    name: groupName,
    position: { x: layer.x, y: layer.y },
    parent: frame,
    child: layer,
    locked,
  });

  // update the `containerSet` object
  const updatedContainerSet = containerSet;
  updatedContainerSet[groupKey] = newInnerGroup.id;

  return {
    newInnerGroup,
    updatedContainerSet,
  };
};

/**
 * @description Sets (finds or builds) the parent container group(s), places the layer in the
 * container(s) and updates the document settings (if a new container group has been created).
 *
 * @kind function
 * @name setLayerInContainers
 * @param {Object} layerToContain An object including the `layer` that needs placement,
 * the `frame` and `page` the layer exists within, the `position` of the layer, and the
 * `type` of annotation or drawing action.
 * @returns {boolean} `true` if the layer was placed successfully, otherwise `false`.
 * @private
 */
const setLayerInContainers = (layerToContain: {
  layer: any,
  frame: { id: string, appendChild: Function },
  page: { getPluginData: Function, setPluginData: Function },
  position: { x: number, y: number },
  type: string,
}) => {
  const {
    layer,
    frame,
    page,
    type,
  } = layerToContain;
  const groupKey = setGroupKey(type);
  const frameId = frame.id;
  const pageSettings = JSON.parse(page.getPluginData(PLUGIN_IDENTIFIER) || null);

  // set some variables
  let layerIsContained = false;
  let outerGroup = null;
  let outerGroupId = null;
  let outerGroupSet = null;
  let innerGroup = null;
  let innerGroupId = null;

  // find the existing `outerGroup` (if it exists)
  if (pageSettings && pageSettings.containerGroups) {
    pageSettings.containerGroups.forEach((containerGroupSet: any) => {
      if (containerGroupSet.frameId === frameId) {
        outerGroupId = containerGroupSet.id;
        outerGroupSet = containerGroupSet;
        innerGroupId = containerGroupSet[groupKey];
      }
      return null;
    });

    // take the found ideas and load the specific layers (if they exist)
    outerGroup = figma.getNodeById(outerGroupId);
    innerGroup = figma.getNodeById(innerGroupId);
  }

  // create new `outerGroup` / `innerGroup` if it does not exist (or cannot be found)
  if (!outerGroup || !innerGroup) {
    // boilerplate settings
    let newPageSettings: any = {};
    let updatedContainerSet: any = { frameId };
    if (pageSettings) {
      newPageSettings = pageSettings;
    }

    if (outerGroupSet) {
      updatedContainerSet = outerGroupSet;
    }

    // remove the existing lookup pair so it does not conflict with the new one
    if (outerGroupId) {
      newPageSettings = updateArray(
        'containerGroups',
        { id: outerGroupId },
        newPageSettings,
        'remove',
      );
    }

    // create the `innerGroup`, if it does not exist
    if (!innerGroup) {
      const ccgResult = createContainerGroup(updatedContainerSet, type, frame, layer);
      innerGroup = ccgResult.newInnerGroup;
      updatedContainerSet = ccgResult.updatedContainerSet;
    }

    // create the `outerGroup`, if it does not exist
    if (!outerGroup) {
      const ccgResult = createContainerGroup(updatedContainerSet, 'topLevel', frame, innerGroup);
      outerGroup = ccgResult.newInnerGroup;
      updatedContainerSet = ccgResult.updatedContainerSet;
    }

    // update the `newPageSettings` array
    newPageSettings = updateArray(
      'containerGroups',
      updatedContainerSet,
      newPageSettings,
      'add',
    );

    // commit the `Settings` update
    layerToContain.page.setPluginData(
      PLUGIN_IDENTIFIER,
      JSON.stringify(newPageSettings),
    );
  }

  if (outerGroup && innerGroup && layer) {
    // ensure the proper parent/child relationships are set in case container layers already exist
    outerGroup.appendChild(innerGroup);
    innerGroup.appendChild(layer);

    // move the outer container layer to the front
    frame.appendChild(outerGroup);

    // set the order of the inner container layers - WIP
    // orderContainerLayers(outerGroup.id, document);

    // set the flag to success
    layerIsContained = true;
  }

  return layerIsContained;
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
   * @description Adds a semi-transparent rectangle to a specific frame based on the parameters
   * received in the `frame` object.
   *
   * @kind function
   * @name addBoundingBox
   * @param {Object} position The position coordinates (`x`, `y`, `width`, and `height`)
   * for the box.
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

    // draw the bounding box
    const boundingBox = buildBoundingBox(position);

    // set it in the correct containers
    const isBoundingBoxSet = setLayerInContainers({
      layer: boundingBox,
      frame: this.frame,
      page: this.page,
      position,
      type: 'boundingBox',
    });

    if (!boundingBox || !isBoundingBoxSet) {
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
