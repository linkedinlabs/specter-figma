import Crawler from '../Crawler';
import {
  getNodeSettings,
  isInternal,
  updateArray,
  updateNestedArray,
  findTopFrame,
} from '../utils/tools';
import {
  DATA_KEYS,
  PLUGIN_IDENTIFIER,
  PLUGIN_NAME,
  SPACING_MATRIX,
} from '../constants';
import {
  buildAnnotation,
  positionAnnotation,
  buildBoundingBox,
  buildAuxAnnotation,
  buildLegendEntry,
  buildLegend,
  positionLegend,
  drawContainerGroup,
} from './annotationBuilders';
import { getLegendFrame } from '../utils/nodeGetters';

const uuid = require('uuid-random');


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
const setGroupKey = (elementType: string):
  'boundingInnerGroupId'
  | 'componentInnerGroupId'
  | 'dimensionInnerGroupId'
  | 'keystopInnerGroupId'
  | 'spacingInnerGroupId'
  | 'styleInnerGroupId'
  | 'id' => {
  let groupKey:
    'boundingInnerGroupId'
    | 'componentInnerGroupId'
    | 'dimensionInnerGroupId'
    | 'keystopInnerGroupId'
    | 'spacingInnerGroupId'
    | 'styleInnerGroupId'
    | 'id' = null;
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
    case 'keystop':
      groupKey = 'keystopInnerGroupId';
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
const setGroupName = (
  elementType:
    'boundingBox'
    | 'component'
    | 'custom'
    | 'dimension'
    | 'keystop'
    | 'spacing'
    | 'style'
    | 'topLevel',
): string => {
  let groupName: string = null;
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
    case 'keystop':
      groupName = 'Keyboard Annotations';
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
 * @description Determines the spacing value (`IS-X`) based on length and returns
 * the appropriate spacing annotation text.
 *
 * @kind function
 * @name retrieveSpacingValue
 *
 * @param {number} length A number representing length.
 * @param {boolean} isMercadoMode Designates whether “Mercado” rules apply.
 *
 * @returns {string} A text label based on the spacing value.
 * @private
 */
const retrieveSpacingValue = (length: number, isMercadoMode: boolean): number => {
  let itemSpacingValue: number = null;

  // Mercado and Art Deco spacing are not an even scales
  // set some breakpoints and “round” `length` to the nearest proper IS-X number
  // ignore anything so large that it’s above `IS-9`
  switch (true) {
    case (length >= 128): // based on 160 – IS-10 (not actually specc'd in Art Deco)
      return length; // return the actual length
    case (length >= 80): // 96 – IS-9
      itemSpacingValue = isMercadoMode ? 96 : 9;
      break;
    case (length >= 56): // 64 – IS-8
      itemSpacingValue = isMercadoMode ? 64 : 8;
      break;
    case (length >= 40): // 48 – IS-7
      itemSpacingValue = isMercadoMode ? 48 : 7;
      break;
    case (length >= 28): // 32 – IS-6
      itemSpacingValue = isMercadoMode ? 32 : 6;
      break;
    case (length >= 20): // 24 – IS-5
      itemSpacingValue = isMercadoMode ? 24 : 5;
      break;
    case (length >= 15): // 16 – IS-4
      itemSpacingValue = isMercadoMode ? 16 : 4;
      break;
    case (length >= 11): // 12 – IS-3
      itemSpacingValue = isMercadoMode ? 12 : 3;
      break;
    case (length >= 7): // 8 – IS-2
      itemSpacingValue = isMercadoMode ? 8 : 2;
      break;
    default:
      itemSpacingValue = isMercadoMode ? 4 : 1; // 4 – IS-1
  }

  return itemSpacingValue;
};

/**
 * @description Resets the node order for the Component, Foundation, and Bounding Box nodes
 * within the outer container group node.
 *
 * @kind function
 * @name orderContainerNodes
 * @param {string} outerGroupId String ID for finding the outer container group.
 * @param {Object} page The page containing the outer container group.
 *
 * @returns {null}
 *
 * @private
 */
const orderContainerNodes = (outerGroupId: string, page): void => {
  const pageSettings = JSON.parse(page.getPluginData(PLUGIN_IDENTIFIER) || {});
  let containerGroupId: string = null;
  let boundingGroupId: string = null;
  let componentGroupId: string = null;
  let dimensionGroupId: string = null;
  let spacingGroupId: string = null;
  let styleGroupId: string = null;

  // find the correct group set and inner groups based on the `outerGroupId`
  pageSettings.containerGroups.forEach((groupSet) => {
    if (groupSet.id === outerGroupId) {
      boundingGroupId = groupSet.boundingInnerGroupId;
      containerGroupId = groupSet.id;
      componentGroupId = groupSet.componentInnerGroupId;
      dimensionGroupId = groupSet.dimensionInnerGroupId;
      spacingGroupId = groupSet.spacingInnerGroupId;
      styleGroupId = groupSet.styleInnerGroupId;
    }
    return null;
  });

  // make sure the container group exists
  const containerGroup: BaseNode = figma.getNodeById(containerGroupId);
  if (containerGroup && containerGroup.type === 'GROUP') {
    // always move bounding box group to bottom of list
    const boundingBoxGroup: BaseNode = figma.getNodeById(boundingGroupId);
    if (boundingBoxGroup && boundingBoxGroup.type === 'GROUP') {
      containerGroup.appendChild(boundingBoxGroup);
    }

    // always move dimension annotations group to second from bottom of list
    const dimensionBoxGroup: BaseNode = figma.getNodeById(dimensionGroupId);
    if (dimensionBoxGroup && dimensionBoxGroup.type === 'GROUP') {
      containerGroup.appendChild(dimensionBoxGroup);
    }

    // always move spacing annotations group to third from bottom of list
    const spacingBoxGroup: BaseNode = figma.getNodeById(spacingGroupId);
    if (spacingBoxGroup && spacingBoxGroup.type === 'GROUP') {
      containerGroup.appendChild(spacingBoxGroup);
    }

    // foundations group moves to second from top
    const styleGroup: BaseNode = figma.getNodeById(styleGroupId);
    if (styleGroup && styleGroup.type === 'GROUP') {
      containerGroup.appendChild(styleGroup);
    }

    // always move component group to top of list
    const componentGroup: BaseNode = figma.getNodeById(componentGroupId);
    if (componentGroup && componentGroup.type === 'GROUP') {
      containerGroup.appendChild(componentGroup);
    }
  }

  return null;
};

/**
 * @description Builds the inner container group that holds annotations of a certain
 * `annotationType` and makes updates to the accompanying parent container group
 * settings object.
 *
 * @kind function
 * @name createContainerGroup
 *
 * @param {Object} containerSet An instance of the parent container group’s settings object.
 * @param {string} groupType A string representing the type of element going inside the continer.
 * @param {Object} frame An object representing the top-level Figma Frame for the container group.
 * @param {Object} node An object representing the Figma node to be set in the container group.
 *
 * @returns {Object} The inner container group node object and the accompanying
 * updated parent container group settings object.
 * @private
 */
export const createContainerGroup = (
  containerSet: {
    boundingInnerGroupId?: string,
    componentInnerGroupId?: string,
    dimensionInnerGroupId?: string,
    keystopInnerGroupId?: string,
    frameId: string,
    spacingInnerGroupId?: string,
    styleInnerGroupId?: string,
  },
  groupType:
    'boundingBox'
    | 'component'
    | 'custom'
    | 'dimension'
    | 'keystop'
    | 'spacing'
    | 'style'
    | 'topLevel',
  frame: FrameNode,
  node: SceneNode,
): {
  newInnerGroup: GroupNode,
  updatedContainerSet: {
    boundingInnerGroupId?: string,
    componentInnerGroupId?: string,
    dimensionInnerGroupId?: string,
    keystopInnerGroupId?: string,
    frameId: string,
    spacingInnerGroupId?: string,
    styleInnerGroupId?: string,
  },
} => {
  const groupName: string = setGroupName(groupType);
  const groupKey: string = setGroupKey(groupType);
  // const locked: boolean = groupType === 'topLevel';
  const locked: boolean = false;

  // set up new container group node on the frame
  const newInnerGroup: GroupNode = drawContainerGroup({
    name: groupName,
    position: { x: node.x, y: node.y },
    parent: frame,
    child: node,
    locked,
  });

  // update the `containerSet` object
  const updatedContainerSet = containerSet;
  updatedContainerSet[groupKey] = newInnerGroup.id;

  if (groupType === 'topLevel') {
    updatedContainerSet.frameId = frame.id;
  }

  return {
    newInnerGroup,
    updatedContainerSet,
  };
};

/**
 * @description Sets (finds or builds) the parent container group(s), places the node in the
 * container(s) and updates the document settings (if a new container group has been created).
 *
 * @kind function
 * @name setNodeInContainers
 * @param {Object} nodeToContain An object including the `node` that needs placement,
 * the `frame` and `page` the node exists within, the `position` of the node, and the
 * `type` of annotation or drawing action.
 *
 * @returns {boolean} `true` if the node was placed successfully, otherwise `false`.
 * @private
 */
const setNodeInContainers = (nodeToContain: {
  node: SceneNode,
  frame: FrameNode,
  page: PageNode,
  type:
    'boundingBox'
    | 'component'
    | 'custom'
    | 'dimension'
    | 'keystop'
    | 'spacing'
    | 'style',
}): {
  boundingInnerGroupId?: string,
  componentInnerGroupId?: string,
  dimensionInnerGroupId?: string,
  frameId: string,
  spacingInnerGroupId?: string,
  styleInnerGroupId?: string,
} => {
  const {
    node,
    frame,
    page,
    type,
  } = nodeToContain;
  const groupType = ['label', 'heading'].includes(type) ? 'keystop' : type;
  const groupKey = setGroupKey(groupType);
  const frameId: string = frame.id;
  const pageSettings = JSON.parse(page.getPluginData(PLUGIN_IDENTIFIER) || null);

  // set some variables
  let outerGroup: any = null;
  let outerGroupId: string = null;
  let outerGroupSet: any = null;
  let innerGroup: any = null;
  let innerGroupId: string = null;
  let containerSet: any = {};

  // find the existing `outerGroup` (if it exists)
  if (pageSettings && pageSettings.containerGroups) {
    pageSettings.containerGroups.forEach((containerGroupSet) => {
      if (containerGroupSet.frameId === frameId) {
        outerGroupId = containerGroupSet.id;
        outerGroupSet = containerGroupSet;
        innerGroupId = containerGroupSet[groupKey];
      }
      return null;
    });

    // take the found ideas and load the specific nodes (if they exist)
    outerGroup = figma.getNodeById(outerGroupId);
    innerGroup = figma.getNodeById(innerGroupId);
  }

  // create new `outerGroup` / `innerGroup` if it does not exist (or cannot be found)
  if (!outerGroup || !innerGroup) {
    // boilerplate settings
    let newPageSettings: any = {};
    let updatedContainerSet: any = {};

    if (pageSettings) {
      newPageSettings = pageSettings;
    }

    if (outerGroupSet) {
      updatedContainerSet = outerGroupSet;
    }

    // remove the existing lookup pair so it does not conflict with the new one
    if (outerGroupId) {
      newPageSettings = updateNestedArray(
        newPageSettings,
        { id: outerGroupId },
        'containerGroups',
        'remove',
      );
    }

    // create the `innerGroup`, if it does not exist
    if (!innerGroup) {
      const ccgResult = createContainerGroup(updatedContainerSet, groupType, frame, node);
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
    newPageSettings = updateNestedArray(
      newPageSettings,
      updatedContainerSet,
      'containerGroups',
      'add',
    );

    // commit the `Settings` update
    page.setPluginData(
      PLUGIN_IDENTIFIER,
      JSON.stringify(newPageSettings),
    );

    containerSet = updatedContainerSet;
  } else {
    containerSet = outerGroupSet;
  }

  if (outerGroup && innerGroup && node) {
    // ensure the proper parent/child relationships are set in case container nodes already exist
    outerGroup.appendChild(innerGroup);
    innerGroup.appendChild(node);

    // move the outer container node to the front
    frame.appendChild(outerGroup);

    // set the order of the inner container nodes
    orderContainerNodes(outerGroup.id, page);
  }

  return containerSet;
};

/**
 * @description Takes the data representing an existing annotation, removes that annotation,
 * and cleans up the data.
 *
 * @kind function
 * @name removeAnnotation
 *
 * @param {Object} existingItemData The data object containing an `id` representting the
 * annotation to be removed.
 *
 * @returns {null}
 * @private
 */
const removeAnnotation = (existingItemData: { id: string }): void => {
  const nodeToDelete = figma.getNodeById(existingItemData.id);
  if (nodeToDelete) {
    nodeToDelete.remove();
  }
  return null;
};

/**
 * @description Retrieves or sets the information on a node in order to track its annotation(s).
 * The ID params use “layer” instead of “node” to match older documents.
 *
 * @kind function
 * @name getSetNodeSettings
 *
 * @param {string} annotationType A string representation the type of annotation,
 * (`annotatedDimensions`, `annotatedLayers`, or `annotatedSpacings`).
 * @param {Object} nodeIdSet A node ID set to find a match for. It needs to container
 * `layerId` at a minimum, but may also container `layerAId`, `layerBId`, and `direction`.
 * @param {Object} page The page containing the outer container group.
 *
 * @returns {null}
 * @private
 */
const getSetNodeSettings = (
  annotationType:
    'annotatedDimensions'
    | 'annotatedLayers'
    | 'annotatedSpacings'
    | 'keystopLayers',
  nodeIdSet: {
    layerId: string,
    layerAId?: string,
    layerBId?: string,
    direction?: 'top' | 'bottom' | 'right' | 'left',
  },
  page: PageNode,
): void => {
  /**
   * @description Takes two sets of node IDs (one from the node directly and one for
   * the query) and tries to match them.
   *
   * @kind function
   * @name nodeMatchCheck
   * @param {Object} nodeSetToMatch A node’s node ID set retrieved from settings. It
   * needs to container `layerId` at a minimum, but may also contain `layerAId`,
   * `layerBId`, and `direction`.
   * @param {Object} nodeIdSetToCheck A node ID set to find a match for. It
   * needs to contain `layerId` at a minimum, but may also contain `layerAId`,
   * `layerBId`, and `direction`.
   *
   * @returns {boolean} `true` if the node ID set matches, otherwise `false`.
   * @private
   */
  const nodeMatchCheck = (nodeSetToMatch, nodeIdSetToCheck): boolean => {
    const {
      layerId,
      layerAId,
      layerBId,
      direction,
    } = nodeIdSetToCheck;

    // if `layerAId` is present, match multiple node IDs
    if (layerAId) {
      if (
        nodeSetToMatch.layerAId === layerAId
        && nodeSetToMatch.layerBId === layerBId
        && nodeSetToMatch.layerId === layerId
        && nodeSetToMatch.direction === direction
      ) {
        return true;
      }
    } else if (nodeSetToMatch.originalId === layerId) {
      // match single node ID
      return true;
    }
    // no matches, return false
    return false;
  };

  // retrieve document settings
  const pageSettings = JSON.parse(page.getPluginData(PLUGIN_IDENTIFIER) || null);

  // check if we have already annotated this element and remove the old annotation
  if (pageSettings && pageSettings[annotationType]) {
    // remove the old ID pair(s) from the `newPageSettings` array
    pageSettings[annotationType].forEach((nodeSet) => {
      if (nodeMatchCheck(nodeSet, nodeIdSet)) {
        removeAnnotation(nodeSet);

        // remove the nodeSet from the `pageSettings` array
        let newPageSettings = JSON.parse(page.getPluginData(PLUGIN_IDENTIFIER));
        newPageSettings = updateNestedArray(
          newPageSettings,
          { id: nodeSet.id },
          annotationType,
          'remove',
        );

        // commit the settings update
        page.setPluginData(
          PLUGIN_IDENTIFIER,
          JSON.stringify(newPageSettings),
        );
      }
    });
  }
};

// --- main Painter class function
/**
 * @description A class to add elements directly onto Figma file frames.
 *
 * @class
 * @name Painter
 *
 * @constructor
 *
 * @property node The SceneNode in the Figma file that we want to annotate or modify.
 * @property frame The top-level FrameNode in the Figma file that we want to annotate or modify.
 * @property page The PageNode in the Figma file containing the corresponding `frame` and `node`.
 */
export default class Painter {
  frame: FrameNode;
  isMercadoMode: boolean;
  node: SceneNode;
  page: PageNode;
  constructor({
    for: node,
    in: page,
    isMercadoMode,
  }) {
    this.isMercadoMode = isMercadoMode;
    this.frame = findTopFrame(node);
    this.node = node;
    this.page = page;
  }

  /**
   * @description Locates annotation text in a node’s Settings object and
   * builds the visual annotation on the Figma frame.
   *
   * @kind function
   * @name addGeneralAnnotation
   *
   * @returns {Object} A result object container success/error status and log/toast messages.
   */
  addGeneralAnnotation() {
    const result: {
      status: 'error' | 'success',
      messages: {
        toast: string,
        log: string,
      },
    } = {
      status: null,
      messages: {
        toast: null,
        log: null,
      },
    };

    const nodeSettings = getNodeSettings(this.page, this.node.id);

    if (!nodeSettings?.annotationText) {
      result.status = 'error';
      result.messages.log = 'Node missing annotationText';
      return result;
    }

    // return an error if the selection is not placed in a frame
    if (!this.frame || (this.frame.id === this.node.id)) {
      result.status = 'error';
      result.messages.log = 'Selection not on frame';
      result.messages.toast = 'Your selection needs to be in an outer frame';
      return result;
    }

    // set up some information
    const {
      annotationText,
      annotationSecondaryText,
      annotationType,
    } = nodeSettings;
    const nodeName = this.node.name;
    const nodeId = this.node.id;
    const groupName = `Annotation for ${nodeName}`;

    // set page settings to track annotation
    getSetNodeSettings('annotatedLayers', { layerId: nodeId }, this.page);

    // construct the base annotation elements
    const annotation = buildAnnotation({
      mainText: annotationText,
      secondaryText: annotationSecondaryText,
      type: annotationType,
    });

    // grab the position from crawler
    const crawler = new Crawler({ for: [this.node] });
    const positionResult = crawler.position();
    const relativePosition = positionResult.payload;

    // group and position the base annotation elements
    const nodePosition: PluginNodePosition = {
      frameWidth: this.frame.width,
      frameHeight: this.frame.height,
      width: relativePosition.width,
      height: relativePosition.height,
      x: relativePosition.x,
      y: relativePosition.y,
    };

    const group = positionAnnotation(
      this.frame,
      groupName,
      annotation,
      nodePosition,
    );

    // set it in the correct containers
    const containerSet = setNodeInContainers({
      node: group,
      frame: this.frame,
      page: this.page,
      type: annotationType,
    });

    // new object with IDs to add to settings
    const newAnnotatedNodeSet: {
      containerGroupId: string,
      id: string,
      originalId: string,
    } = {
      containerGroupId: containerSet.componentInnerGroupId,
      id: group.id,
      originalId: nodeId,
    };

    // update the `newPageSettings` array
    let newPageSettings = JSON.parse(this.page.getPluginData(PLUGIN_IDENTIFIER) || null);
    newPageSettings = updateNestedArray(
      newPageSettings,
      newAnnotatedNodeSet,
      'annotatedLayers',
      'add',
    );

    // commit the `Settings` update
    this.page.setPluginData(
      PLUGIN_IDENTIFIER,
      JSON.stringify(newPageSettings),
    );

    // return a successful result
    result.status = 'success';
    return result;
  }

  /**
   * @description Adds a semi-transparent rectangle to a specific frame based on the parameters
   * received in the `frame` object.
   *
   * @kind function
   * @name addBoundingBox
   * @param {Object} position The position coordinates (`x`, `y`, `width`, and `height`)
   * for the box.
   *
   * @returns {Object} A result object container success/error status and log/toast messages.
   */
  addBoundingBox(position) {
    const result: {
      status: 'error' | 'success',
      messages: {
        toast: string,
        log: string,
      },
    } = {
      status: null,
      messages: {
        toast: null,
        log: null,
      },
    };

    // draw the bounding box
    const boundingBox = buildBoundingBox(position);

    // set it in the correct containers
    const containerSet = setNodeInContainers({
      node: boundingBox,
      frame: this.frame,
      page: this.page,
      type: 'boundingBox',
    });

    if (!boundingBox || !containerSet.boundingInnerGroupId) {
      result.status = 'error';
      result.messages.log = 'Failed to draw the bounding box for a selection';
      result.messages.toast = 'Hmm… an error occured drawing that bounding box 😬';

      return result;
    }

    result.status = 'success';
    result.messages.log = `Bounding box drawn on “${this.frame.name}”`;

    return result;
  }

  /**
   * @description Takes a node and creates two dimension annotations with the node’s
   * `height` and `width`.
   *
   * @kind function
   * @name addDimMeasurement
   *
   * @returns {Object} A result object container success/error status and log/toast messages.
   */
  addDimMeasurement() {
    const result: {
      status: 'error' | 'success',
      messages: {
        toast: string,
        log: string,
      },
    } = {
      status: null,
      messages: {
        toast: null,
        log: null,
      },
    };

    // return an error if the selection is not placed in a frame
    if (!this.frame) {
      result.status = 'error';
      result.messages.log = 'Selection not on frame';
      result.messages.toast = 'Your selection needs to be in a frame';
      return result;
    }

    // set up some information
    const annotationType = 'dimension';
    const nodeId = this.node.id;
    const nodeName = this.node.name;

    // set page settings to track annotation
    getSetNodeSettings('annotatedDimensions', { layerId: nodeId }, this.page);

    // grab the position from crawler
    const crawler = new Crawler({ for: [this.node] });
    const positionResult = crawler.position();
    const relativePosition = positionResult.payload;

    // group and position the annotation elements
    const nodePosition: PluginNodePosition = {
      frameWidth: this.frame.width,
      frameHeight: this.frame.height,
      width: relativePosition.width,
      height: relativePosition.height,
      x: relativePosition.x,
      y: relativePosition.y,
    };

    // ------------------------
    // construct the width annotation elements
    const roundedWidthNumber: number = Math.round(
      (this.node.width + Number.EPSILON) * 100,
    ) / 100;
    const annotationTextWidth: string = `${roundedWidthNumber}dp`;
    const groupNameWidth: string = `Dimension Width for layer ${nodeName}`;
    const annotationWidth = buildAnnotation({
      mainText: annotationTextWidth,
      type: annotationType,
    });

    const annotationOrientation = 'top';
    const groupWidth = positionAnnotation(
      this.frame,
      groupNameWidth,
      annotationWidth,
      nodePosition,
      annotationType,
      annotationOrientation,
    );

    // set it in the correct containers
    const containerSetWidth = setNodeInContainers({
      node: groupWidth,
      frame: this.frame,
      page: this.page,
      type: annotationType,
    });

    // new object with IDs to add to settings
    const newAnnotatedDimensionSetWidth: {
      containerGroupId: string,
      id: string,
      originalId: string,
    } = {
      containerGroupId: containerSetWidth.componentInnerGroupId,
      id: groupWidth.id,
      originalId: nodeId,
    };

    // update the `newPageSettings` array
    let newPageSettings = JSON.parse(this.page.getPluginData(PLUGIN_IDENTIFIER) || null);
    newPageSettings = updateNestedArray(
      newPageSettings,
      newAnnotatedDimensionSetWidth,
      'annotatedDimensions',
      'add',
    );

    // ------------------------
    // construct the height annotation elements
    const roundedHeightNumber: number = Math.round(
      (this.node.height + Number.EPSILON) * 100,
    ) / 100;
    const annotationTextHeight: string = `${roundedHeightNumber}dp`;
    const groupNameHeight: string = `Dimension Height for layer ${nodeName}`;
    const annotationHeight = buildAnnotation({
      mainText: annotationTextHeight,
      type: annotationType,
    });

    const annotationOrientationHeight = 'right';
    const groupHeight = positionAnnotation(
      this.frame,
      groupNameHeight,
      annotationHeight,
      nodePosition,
      annotationType,
      annotationOrientationHeight,
    );

    // set it in the correct containers
    const containerSetHeight = setNodeInContainers({
      node: groupHeight,
      frame: this.frame,
      page: this.page,
      type: annotationType,
    });

    // new object with IDs to add to settings
    const newAnnotatedDimensionSetHeight: {
      containerGroupId: string,
      id: string,
      originalId: string,
    } = {
      containerGroupId: containerSetHeight.componentInnerGroupId,
      id: groupHeight.id,
      originalId: nodeId,
    };

    // update the `newPageSettings` array
    newPageSettings = updateNestedArray(
      newPageSettings,
      newAnnotatedDimensionSetHeight,
      'annotatedDimensions',
      'add',
    );

    // ------------------------

    // commit the `Settings` update
    this.page.setPluginData(
      PLUGIN_IDENTIFIER,
      JSON.stringify(newPageSettings),
    );

    // return a successful result
    result.status = 'success';
    result.messages.log = `Dimensions annotated for “${this.node.name}”`;
    return result;
  }

  /**
   * @description This sets tracking data for an annotation to establish link with relevant node.
   *
   * @kind function
   * @name setTrackingData
   *
   * @param {Object} annotationNode The node containing the annotation layers.
   * @param {Object} nodePosition The box coordinates (`x`, `y`, `width`, and `height`).
   * @param {string} type The type of annotation to repair (`keystop` or `label`).
   * @param {Object} legendNode The node containing the legend entry for the annotation.
   *
   * @returns {undefined}
   */
  setTrackingData(
    annotationNode: FrameNode,
    nodePosition,
    type: PluginStopType,
    legendNode: FrameNode,
  ) {
    // ---------- set node tracking data
    const linkId: string = uuid();
    const newAnnotatedNodeData: PluginNodeTrackingData = {
      annotationId: annotationNode.id,
      legendItemId: legendNode?.id,
      id: this.node.id,
      linkId,
      topFrameId: this.frame.id,
      nodePosition,
    };

    // set data types
    const annotationsDataType = DATA_KEYS[`${type}Annotations`];
    const linkIdDataType = DATA_KEYS[`${type}LinkId`];

    // update the `trackingSettings` array
    const trackingDataRaw = JSON.parse(
      this.page.getPluginData(annotationsDataType) || null,
    );
    let trackingData: Array<PluginNodeTrackingData> = [];
    if (trackingDataRaw) {
      trackingData = trackingDataRaw;
    }

    // set the node data in the `trackingData` array
    trackingData = updateArray(
      trackingData,
      newAnnotatedNodeData,
      'id',
      'update',
    );

    // commit the `trackingData` update
    this.page.setPluginData(
      annotationsDataType,
      JSON.stringify(trackingData),
    );

    // set the `linkId` on the annotated node
    const nodeLinkData: PluginNodeLinkData = {
      id: linkId,
      role: 'node',
    };
    this.node.setPluginData(
      linkIdDataType,
      JSON.stringify(nodeLinkData),
    );

    // set the `linkId` on the annotation node
    const annotatedLinkData: PluginNodeLinkData = {
      id: linkId,
      role: 'annotation',
    };
    annotationNode.setPluginData(
      linkIdDataType,
      JSON.stringify(annotatedLinkData),
    );

    if (legendNode) {
      // set the `linkId` on the legend node
      const legendLinkData: PluginNodeLinkData = {
        id: linkId,
        role: 'legendItem',
      };
      legendNode.setPluginData(
        linkIdDataType,
        JSON.stringify(legendLinkData),
      );
    }
  }

  /**
   * @description Builds a stop annotation in Figma. Expects appropriate node data to
   * be available (`annotationText`, `labels`, and potentially `keys` for auxilary annotations).
   *
   * @kind function
   * @name addStop
   *
   * @param {string} type The type of annotation to add (currently: `keystop` or `label`).
   *
   * @returns {Object} A result object container success/error status and log/toast messages.
   */
  addStop(type: PluginStopType) {
    const result: {
      status: 'error' | 'success',
      messages: {
        toast: string,
        log: string,
      },
    } = {
      status: null,
      messages: {
        toast: null,
        log: null,
      },
    };

    result.messages.log = `Draw the ${type} stop annotation for “${this.node.name}”`;

    // retrieve the node data with our annotation text
    const nodeData = JSON.parse(this.node.getPluginData(DATA_KEYS[`${type}NodeData`]) || null);

    if (!nodeData?.annotationText) {
      result.status = 'error';
      result.messages.log = 'Node missing annotationText';
      return result;
    }

    // return an error if the selection is not placed in a frame
    if (!this.frame || (this.frame.id === this.node.id)) {
      result.status = 'error';
      result.messages.log = 'Selection not on frame';
      result.messages.toast = 'Your selection needs to be in an outer frame';
      return result;
    }

    // set up some information
    const { keys } = nodeData;
    const { annotationText } = nodeData;
    const typeCapitalized = type.charAt(0).toUpperCase() + type.slice(1);
    const annotationName = `${typeCapitalized} for ${this.node.name}`;

    // construct the base annotation elements
    const annotationBundle = buildAnnotation({
      mainText: annotationText,
      secondaryText: null,
      type,
    });

    // set individual `keys` annotations for keystops
    const auxAnnotations: Array<FrameNode> = [];
    if (type === 'keystop' && keys?.length) {
      keys.forEach((keyEntry) => {
        const auxAnnotation: FrameNode = buildAuxAnnotation(keyEntry);
        auxAnnotation.layoutAlign = 'INHERIT';
        auxAnnotations.push(auxAnnotation);
      });
    }

    // grab the position from crawler
    const crawler = new Crawler({ for: [this.node] });
    const positionResult = crawler.position();
    const relativePosition = positionResult.payload;

    // ---------- group and position the base annotation elements
    // set up `nodePosition` based on `frame` and `relativePosition` from `Crawler`
    const nodePosition: PluginNodePosition = {
      frameWidth: this.frame.width,
      frameHeight: this.frame.height,
      width: relativePosition.width,
      height: relativePosition.height,
      x: relativePosition.x,
      y: relativePosition.y,
    };

    // position the base annotation on the artboard
    const baseAnnotationNode = positionAnnotation(
      this.frame,
      annotationName,
      annotationBundle,
      nodePosition,
      type,
    );
    const initialX = baseAnnotationNode.x;
    const initialY = baseAnnotationNode.y;

    // if applicable, add auxilary annotations (currently `keys`)
    let annotationNode: FrameNode = baseAnnotationNode;
    let legendNode: FrameNode = null;
    if (auxAnnotations.length) {
      annotationNode = figma.createFrame();
      annotationNode.clipsContent = false;
      annotationNode.layoutMode = 'HORIZONTAL';
      annotationNode.counterAxisSizingMode = 'AUTO';
      annotationNode.layoutAlign = 'INHERIT';
      annotationNode.itemSpacing = 4;
      annotationNode.fills = [];
      annotationNode.name = `${baseAnnotationNode.name} (with Keys)`;

      // add the base annotation
      annotationNode.appendChild(baseAnnotationNode);

      // add the key annotations
      auxAnnotations.forEach(auxAnnotation => annotationNode.appendChild(auxAnnotation));

      baseAnnotationNode.layoutAlign = 'INHERIT';
      annotationNode.resize(baseAnnotationNode.width, baseAnnotationNode.height);
      annotationNode.x = initialX;
      annotationNode.y = initialY;
    }

    // if (['label', 'heading'].includes(type)) {
      legendNode = buildLegendEntry(type, nodeData);
      this.addEntryToLegend(legendNode);
    // }

    // set the annotation frame(s) into the correct container group layers in Figma
    setNodeInContainers({
      node: annotationNode,
      frame: this.frame,
      page: this.page,
      type: type as 'boundingBox'
    | 'component'
    | 'custom'
    | 'dimension'
    | 'keystop'
    | 'spacing'
    | 'style',
    });

    // ---------- set node tracking data with new annotation
    this.setTrackingData(annotationNode, nodePosition, type, legendNode);

    result.status = 'success';
    return result;
  }

  /**
   * @description Updates the annotation legend, creating it and setting tracking if it
   * doesn't exist yet.
   *
   * @kind function
   * @name addEntryToLegend
   *
   * @param {Object} legendNode The newly created legend entry for the annotation.
   *
   * @returns {undefined}
   */
  addEntryToLegend(legendNode) {
    let legend = getLegendFrame(this.frame.id, this.page);
    if (!legend) {
      legend = buildLegend();
      legend.name = `+++ ${PLUGIN_NAME} +++ ${this.frame.name} Legend`;

      const {
        x, y, width, height,
      } = this.frame;
      const positionedLegend = positionLegend(legend, {
        x, y, width, height,
      });

      this.page.appendChild(positionedLegend);

      const legendLinkId: string = uuid(); // specifically for legend frame
      legend.setPluginData(DATA_KEYS.legendLinkId, JSON.stringify({ id: legendLinkId, role: 'legend' }));
      this.frame.setPluginData(DATA_KEYS.legendLinkId, JSON.stringify({ id: legendLinkId, role: 'frame' }));

      // update frame tracking data
      const frameTrackingData = JSON.parse(this.page.getPluginData(DATA_KEYS.legendFrames) || '[]');
      frameTrackingData.push({
        id: this.frame.id,
        legendId: legend.id,
        linkId: legendLinkId,
        framePosition: {
          x, y, width, height,
        },
      });
      this.page.setPluginData(DATA_KEYS.legendFrames, JSON.stringify(frameTrackingData));
    }

    legend.appendChild(legendNode);
  }

  /**
   * @description Takes a `spacingPosition` object and creates a spacing measurement annotation
   * with the correct spacing number (“IS-X”). If the calculated spacing number is larger
   * than “IS-9”, the annotation is created with digital points/pixels.
   *
   * @kind function
   * @name addSpacingAnnotation
   *
   * @param {Object} spacingPosition The `x`, `y` coordinates, `width`, `height`, and `orientation`
   * of an entire selection. It should also includes node IDs (`layerAId` and `layerBId`)
   * for the two nodes used to calculated the gap OR `layerId` for the single node in the
   * case of an auto-layout, padded node.
   *
   * @returns {null}
   */
  addSpacingAnnotation(spacingPosition): boolean {
    // set up some information
    const measurementToUse: number = spacingPosition.orientation === 'vertical'
      ? spacingPosition.width : spacingPosition.height;
    const measurementToUseRounded: number = Math.round(
      (measurementToUse + Number.EPSILON) * 100,
    ) / 100;
    let spacingValue: number | string = isInternal()
      ? retrieveSpacingValue(measurementToUseRounded, this.isMercadoMode) : measurementToUseRounded;

    // set prefix
    let spacingPrefix: string = '';
    if (isInternal() && spacingValue < 100) {
      if (this.isMercadoMode) {
        const spacingItem = SPACING_MATRIX.find(spacing => spacing.unit === spacingValue);
        if (spacingItem) {
          spacingValue = spacingItem.token;
        }
      } else if (spacingValue < 10) {
        spacingPrefix = 'IS-';
      }
    }

    // set suffix
    let spacingSuffix: string = 'dp';
    if (
      isInternal()
      && ((!this.isMercadoMode && (spacingValue < 10)) || this.isMercadoMode)
    ) {
      spacingSuffix = '';
    }

    const annotationText: string = `${spacingPrefix}${spacingValue}${spacingSuffix}`;
    const annotationType = 'spacing';
    const nodeName: string = this.node.name;
    const groupName: string = `Spacing for ${nodeName} (${spacingPosition.direction})`;

    // set page settings
    // use “layer” instead of “node” to match older documents
    getSetNodeSettings(
      'annotatedSpacings',
      {
        layerId: spacingPosition.layerId,
        layerAId: spacingPosition.layerAId,
        layerBId: spacingPosition.layerBId,
        direction: spacingPosition.direction,
      },
      this.page,
    );

    // construct the base annotation elements
    const annotation = buildAnnotation({
      mainText: annotationText,
      type: annotationType,
    });

    // group and position the base annotation elements
    const nodePosition: PluginNodePosition = {
      frameWidth: this.frame.width,
      frameHeight: this.frame.height,
      width: spacingPosition.width,
      height: spacingPosition.height,
      x: spacingPosition.x,
      y: spacingPosition.y,
    };

    const annotationOrientation = (spacingPosition.orientation === 'vertical' ? 'top' : 'left');
    const group = positionAnnotation(
      this.frame,
      groupName,
      annotation,
      nodePosition,
      annotationType,
      annotationOrientation,
    );

    // set it in the correct containers
    const containerSet = setNodeInContainers({
      node: group,
      frame: this.frame,
      page: this.page,
      type: annotationType,
    });

    // new object with IDs to add to settings
    // use “layer” instead of “node” to match older documents
    const newAnnotatedSpacingSet: {
      containerGroupId: string,
      id: string,
      layerId?: string,
      layerAId?: string,
      layerBId?: string,
      direction: 'top' | 'bottom' | 'right' | 'left',
    } = {
      containerGroupId: containerSet.componentInnerGroupId,
      id: group.id,
      layerId: spacingPosition.layerId,
      layerAId: spacingPosition.layerAId,
      layerBId: spacingPosition.layerBId,
      direction: spacingPosition.direction,
    };

    // update the `newPageSettings` array
    let newPageSettings = JSON.parse(this.page.getPluginData(PLUGIN_IDENTIFIER) || null);
    newPageSettings = updateNestedArray(
      newPageSettings,
      newAnnotatedSpacingSet,
      'annotatedSpacings',
      'add',
    );

    // commit the `Settings` update
    this.page.setPluginData(
      PLUGIN_IDENTIFIER,
      JSON.stringify(newPageSettings),
    );

    return true;
  }

  /**
   * @description Takes a `spacingPosition` object from Crawler and creates a spacing measurement
   * annotation with the correct spacing number (“IS-X”).
   *
   * @kind function
   * @name addGapMeasurement
   *
   * @param {Object} spacingPosition The `x`, `y` coordinates, `width`, `height`, and `orientation`
   * of an entire selection. It should also includes node IDs (`layerAId` and `layerBId`)
   * for the two nodes used to calculated the gap.
   *
   * @returns {Object} A result object container success/error status and log/toast messages.
   */
  addGapMeasurement(spacingPosition) {
    const result: {
      status: 'error' | 'success',
      messages: {
        toast: string,
        log: string,
      },
    } = {
      status: null,
      messages: {
        toast: null,
        log: null,
      },
    };

    // return an error if the selection is not placed in a frame
    if (!this.frame) {
      result.status = 'error';
      result.messages.log = 'Selection not on artboard';
      result.messages.toast = 'Your selection needs to be in a frame';
      return result;
    }

    // return an error if the selection is not placed in a frame
    if (!spacingPosition) {
      result.status = 'error';
      result.messages.log = 'spacingPosition is missing';
      result.messages.toast = 'Could not find a gap in your selection';
      return result;
    }

    // set direction (type)
    spacingPosition.direction = 'gap'; // eslint-disable-line no-param-reassign

    // add the annotation
    const annotationCompleted = this.addSpacingAnnotation(spacingPosition);

    // raise a toast/error if the build is internal and the spacing is more than IS-9
    if (!annotationCompleted) {
      result.status = 'error';
      result.messages.log = 'The spacing annotation could not be added.';
      return result;
    }

    // return a successful result
    result.status = 'success';
    result.messages.log = `Spacing annotated for “${this.node.name}”`;
    return result;
  }

  /**
   * @description Takes a `overlapFrames` object from Crawler and creates spacing measurement
   * annotations with the correct spacing number (“IS-X”) in the selected directions (top, bottom,
   * right, and left). The default is all four directions.
   *
   * @kind function
   * @name addOverlapMeasurements
   *
   * @param {Object} overlapFrames The `top`, `bottom`, `right`, and `left` frames. Each frame
   * contains `x`, `y` coordinates, `width`, `height`, and `orientation`. The object also includes
   * node IDs (`layerAId` and `layerBId`) for the two nodes used to calculated the
   * overlapped areas.
   * @param {Array} directions An optional array containing 4 unique strings representating
   * the annotation directions: `top`, `bottom`, `right`, `left`.
   *
   * @returns {Object} A result object container success/error status and log/toast messages.
   */
  addOverlapMeasurements(
    overlapFrames,
    directions: Array<'top' | 'bottom' | 'right' | 'left'> = ['top', 'bottom', 'right', 'left'],
  ) {
    const result: {
      status: 'error' | 'success',
      messages: {
        toast: string,
        log: string,
      },
    } = {
      status: null,
      messages: {
        toast: null,
        log: null,
      },
    };

    // return an error if the selection is not placed in a frame
    if (!this.frame) {
      result.status = 'error';
      result.messages.log = 'Selection not on artboard';
      result.messages.toast = 'Your selection needs to be in a frame';
      return result;
    }

    // return an error if the selection is not placed in a frame
    if (!overlapFrames) {
      result.status = 'error';
      result.messages.log = 'overlapFrames is missing';
      result.messages.toast = 'Could not find overlapped layers in your selection';
      return result;
    }

    directions.forEach((direction) => {
      // do not annotate if the results are negative, or less than a single
      // IS-X spacing unit
      if (overlapFrames[direction].width <= 2 || overlapFrames[direction].height <= 2) {
        return null;
      }

      // otherwise, set up the frame we can use for the annotation
      let frameX = overlapFrames[direction].x + (overlapFrames[direction].width / 2);
      let frameY = overlapFrames[direction].y;

      if ((direction === 'left') || (direction === 'right')) {
        frameY = overlapFrames[direction].y + (overlapFrames[direction].height / 2);
        frameX = overlapFrames[direction].x;
      }

      // set up position object
      // use “layer” instead of “node” to match older documents
      const spacingPosition: {
        x: number,
        y: number,
        width: number,
        height: number,
        orientation: 'horizontal' | 'vertical',
        layerId?: string,
        layerAId?: string,
        layerBId?: string,
        direction: 'top' | 'bottom' | 'right' | 'left',
      } = {
        x: frameX,
        y: frameY,
        width: overlapFrames[direction].width,
        height: overlapFrames[direction].height,
        orientation: overlapFrames[direction].orientation,
        layerId: overlapFrames.layerId,
        layerAId: overlapFrames.layerAId,
        layerBId: overlapFrames.layerBId,
        direction,
      };

      return this.addSpacingAnnotation(spacingPosition);
    });

    // return a successful result
    result.status = 'success';
    result.messages.log = `Spacing (${directions.join(', ')}) annotated for “${this.node.name}”`;
    return result;
  }
}
