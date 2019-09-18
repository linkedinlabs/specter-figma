import {
  findFrame,
  getLayerSettings,
  hexToDecimalRgb,
  updateArray,
} from './Tools';
import {
  COLORS,
  PLUGIN_IDENTIFIER,
  PLUGIN_NAME,
  TYPEFACES,
} from './constants';

// --- private functions for drawing/positioning annotation elements in the Figma file
/** WIP
 * @description Builds the initial annotation elements in Sketch (diamond, rectangle, text).
 *
 * @kind function
 * @name buildAnnotation
 * @param {Object} annotationText The text for the annotation.
 * @param {Object} annotationSecondaryText Optional secondary text for the annotation.
 * @param {string} annotationType A string representing the type of annotation
 * (component or foundation).
 * @returns {Object} Each annotation element (`diamond`, `rectangle`, `text`).
 * @private
 */
const buildAnnotation = (
  annotationText,
  annotationSecondaryText,
  annotationType = 'component',
) => {
  // set the dominant color
  let colorHex = null;
  switch (annotationType) {
    case 'component':
      colorHex = COLORS.component;
      break;
    case 'custom':
      colorHex = COLORS.custom;
      break;
    case 'dimension':
      colorHex = COLORS.dimension;
      break;
    case 'spacing':
      colorHex = COLORS.spacing;
      break;
    case 'style':
      colorHex = COLORS.style;
      break;
    default:
      colorHex = COLORS.component;
  }

  let setText = annotationText;
  if (annotationSecondaryText) {
    setText = `${annotationText}\n${annotationSecondaryText}`;
  }

  let isMeasurement = false;
  if (
    annotationType === 'spacing'
    || annotationType === 'dimension'
  ) {
    isMeasurement = true;
  }

  // build the text box
  const textPosition = {
    x: 16,
    y: 0,
  };

  if (isMeasurement) {
    textPosition.x = 4;
    textPosition.y = -1;
  }

  // adjustment for two-line annotations
  let rectTextBuffer = 0;
  if (annotationSecondaryText) {
    rectTextBuffer = 22;
  }

  // set up the color object
  // with each color in decimal format: `{r: 1, g: 0.4, b: 0.4}`
  const color = hexToDecimalRgb(colorHex);

  // build the rounded rectangle
  const rectHeight = (isMeasurement ? 22 : 30) + rectTextBuffer;
  const rectangle = figma.createRectangle();
  rectangle.name = 'Rectangle';

  // position and size the rectangle
  rectangle.x = 0;
  rectangle.y = -rectTextBuffer;
  rectangle.resize(200, rectHeight);

  // style it – set the rectangle type, color, and opacity
  rectangle.fills = [{
    type: 'SOLID',
    color,
  }];

  // set rounded corners of the rectangle
  rectangle.topLeftRadius = 2;
  rectangle.topRightRadius = 2;
  rectangle.bottomLeftRadius = 2;
  rectangle.bottomRightRadius = 2;

  // build the dangling diamond
  const diamondOffset = (isMeasurement ? 19 : 30);
  const diamond = figma.createRectangle();
  diamond.name = 'Diamond';

  // position and size the diamond
  diamond.x = 0;
  diamond.y = diamondOffset;
  diamond.resize(6, 6);
  diamond.rotation = 45;

  // style it – set the diamond type, color, and opacity
  diamond.fills = [{
    type: 'SOLID',
    color,
  }];

  // create empty text layer
  const text = figma.createText();

  // style text layer
  text.fontName = TYPEFACES.primary;
  text.fontSize = 12;
  text.lineHeight = { value: 22, unit: 'PIXELS' };
  text.fills = [{
    type: 'SOLID',
    color: hexToDecimalRgb('#ffffff'),
  }];

  // set text – cannot do this before defining `fontName`
  text.characters = setText;

  // position and size the text
  text.x = textPosition.x;
  text.y = (textPosition.y - rectTextBuffer);
  text.textAlignVertical = 'CENTER';
  text.textAlignHorizontal = 'CENTER';
  text.resize(text.width, rectHeight);
  text.constraints = {
    horizontal: 'CENTER',
    vertical: 'CENTER',
  };
  text.textAutoResize = 'WIDTH_AND_HEIGHT';

  // adjust rectangle width based on text width
  const textWidth = text.width;
  const textPadding = (isMeasurement ? 6 : 32);
  const rectangleWidth = textWidth + textPadding;
  rectangle.resize(rectangleWidth, rectangle.height);

  // move the diamond to the mid-point of the rectangle
  const diamondMidX = ((rectangleWidth - 6) / 2);
  diamond.x = diamondMidX;

  // set z-axis placement of all elements
  // rectangle.moveToFront();
  // text.index = rectangle.index + 1;
  // diamond.index = rectangle.index - 1;

  // icon TKTK
  // let icon = null;
  // if (isMeasurement) {
  //   icon = buildMeasureIcon(frame, colorHex);
  //   icon.moveToBack();
  //   icon.x = diamondMidX - 2;
  //   icon.y = rectangle.height + 4;
  // }

  // return an object with each element
  return {
    diamond,
    rectangle,
    text,
    // icon,
  };
};

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

/** WIP
 * @description Takes the individual annotation elements, the specs for the layer(s) receiving
 * the annotation, and adds the annotation to the container group in the proper position.
 *
 * @kind function
 * @name positionAnnotation
 * @param {Object} containerGroup The group layer that holds all annotations.
 * @param {string} groupName The name of the group that holds the annotation elements
 * inside the `containerGroup`.
 * @param {Object} annotation Each annotation element (`diamond`, `rectangle`, `text`).
 * @param {Object} layerPosition The frame specifications (`width`, `height`, `x`, `y`, `index`)
 * for the layer receiving the annotation + the artboard width/height (`artboardWidth` /
 * `artboardHeight`).
 * @param {string} annotationType An optional string representing the type of annotation.
 * @param {string} orientation An optional string representing the orientation of the
 * annotation (`top` or `left`).
 *
 * @returns {Object} The final annotation as a layer group.
 * @private
 */
const positionAnnotation = (
  frame,
  groupName,
  annotation,
  layerPosition,
  annotationType = 'component',
  orientation = 'top',
) => {
  const {
    diamond,
    rectangle,
    text,
    icon,
  } = annotation;

  const { artboardWidth, artboardHeight } = layerPosition;
  const layerWidth = layerPosition.width;
  const layerHeight = layerPosition.height;
  const layerX = layerPosition.x;
  const layerY = layerPosition.y;

  let isMeasurement = false;
  if (
    annotationType === 'spacing'
    || annotationType === 'dimension'
  ) {
    isMeasurement = true;
  }

  // create the annotation group
  const groupArray = [];
  if (icon) { groupArray.push(icon); }
  if (rectangle) { groupArray.push(rectangle); }
  if (diamond) { groupArray.push(diamond); }
  if (text) { groupArray.push(text); }

  const group = figma.group(groupArray, frame);
  group.name = groupName;

  // ------- position the group within the artboard, above the layer receiving the annotation
  let artboardEdge = null;

  // initial placement based on layer to annotate

  // for top
  let placementX = (
    layerX + (
      (layerWidth - group.width) / 2
    )
  );
  // for `left` or `right`
  let placementY = (
    layerY + (
      (layerHeight - group.height) / 2
    )
  );

  let offsetX = null;
  let offsetY = null;
  let iconOffsetX = 0;
  let iconOffsetY = 0;

  // adjustments based on orientation
  switch (orientation) {
    case 'left':
      offsetX = (isMeasurement ? 40 : 38);
      placementX = layerX - offsetX;
      break;
    case 'right':
      offsetX = (isMeasurement ? 12 : 5);
      placementX = layerX + layerWidth + offsetX;
      break;
    default: // top
      offsetY = (isMeasurement ? 33 : 38);
      placementY = layerY - offsetY;
  }

  // correct for left bleed
  if (placementX < 0) {
    artboardEdge = 'left';
    placementX = 5;

    // dimension/spacing annotations get their own special correction
    if (icon) {
      iconOffsetX = placementX;
    }
  }

  // correct for right bleed
  if ((placementX + group.width) > artboardWidth) {
    artboardEdge = 'right';
    placementX = artboardWidth - group.width - 3;

    // dimension/spacing annotations get their own special correction
    if (icon) {
      placementX -= 3;
      iconOffsetX = placementX;
    }
  }

  // correct for top bleed
  if (placementY < 0) {
    artboardEdge = 'top';
    placementY = 5;

    // dimension/spacing annotations get their own special correction
    if (icon) {
      placementY = 2;
      iconOffsetY = placementY;
    }
  }

  // correct for bottom bleed
  if (placementY > (artboardHeight - group.height)) {
    artboardEdge = 'bottom';
    offsetY = icon ? 2 : 5;
    placementY = (artboardHeight - group.height - offsetY);

    if (icon) {
      iconOffsetY = null;
    }
  }

  // set annotation group placement, relative to container group
  group.x = placementX;
  group.y = placementY;

  // adjust diamond on horizonal placement, if necessary
  if (artboardEdge) {
    // move the diamond to the mid-point of the layer to annotate
    let diamondLayerMidX = null;
    switch (artboardEdge) {
      case 'left':
        diamondLayerMidX = ((layerX - group.x) + ((layerWidth - 6) / 2));
        break;
      case 'right':
        diamondLayerMidX = ((layerX - group.x) + ((layerWidth - 6) / 2));
        break;
      default:
        diamondLayerMidX = diamond.x;
    }
    diamond.x = diamondLayerMidX;
  }

  // move diamand to left/right edge, if necessary
  if (orientation === 'left' || orientation === 'right') {
    const diamondNewY = rectangle.y + (rectangle.height / 2) - 3;
    let diamondNewX = null;

    if (orientation === 'left') {
      // move the diamond to the left mid-point of the layer to annotate
      diamondNewX = rectangle.x + rectangle.width - 3;
    } else {
      // move the diamond to the right mid-point of the layer to annotate
      diamondNewX = rectangle.x - 3;
    }

    // re-position diamond
    diamond.x = diamondNewX;
    diamond.y = diamondNewY;

    // re-size the annotation group frame
    group.y += 2;
  }

  // adjust diamond based on artboard edge, if necessary
  if (artboardEdge && isMeasurement) {
    switch (artboardEdge) {
      case 'bottom':
        diamond.y = rectangle.height - diamond.height - offsetY;
        break;
      case 'left':
        diamond.x = diamond.width / 2;
        break;
      case 'right':
        diamond.x = rectangle.width - diamond.width - offsetX - 2;
        break;
      case 'top':
        diamond.y = diamond.height / 2;
        break;
      default:
        diamond.y = diamond.y;
    }
  }

  // adjust the measure icon width for top-oriented annotations
  if (orientation === 'top' && icon) {
    icon.width = layerWidth;

    if (iconOffsetX > 0) {
      if (artboardEdge === 'left') {
        icon.x -= icon.x;
      } else {
        icon.x = (
          artboardWidth - group.x - icon.width
        );
      }
    } else {
      icon.x = (rectangle.width - layerWidth) / 2;
    }
  }

  // // adjust the measure icon height for left-/right-oriented annotations
  // if (orientation !== 'top') {
  //   // remove horizontal icon (easier to re-draw)
  //   icon.remove();

  //   // redraw icon in vertical orientation
  //   const measureIconColor = (annotationType === 'spacing' ? COLORS.spacing : COLORS.dimension);
  //   const iconNew = buildMeasureIcon(group, measureIconColor, 'vertical');

  //   // resize icon based on gap/layer height
  //   iconNew.height = layerHeight;

  //   // position icon on `y`
  //   if (iconOffsetY !== null) {
  //     if (iconOffsetY > 0) {
  //       // move the icon back to the top of the artboard
  //       iconNew.y -= iconNew.y;
  //     } else {
  //       iconNew.y = (rectangle.height - layerHeight) / 2;
  //     }
  //   } else {
  //     iconNew.y = group.height - iconNew.height;
  //   }

  //   // position icon on `x` based on orientation
  //   if (orientation === 'right') {
  //     iconNew.x = rectangle.x - 10;
  //   } else {
  //     iconNew.x = rectangle.x + rectangle.width + 4;
  //   }
  // }

  return group;
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
 * @description Resets the layer order for the Component, Foundation, and Bounding Box layers
 * within the outer container group layer.
 *
 * @kind function
 * @name orderContainerLayers
 * @param {string} outerGroupId String ID for finding the outer container group.
 * @param {Object} page The page containing the outer container group.
 *
 * @private
 */
const orderContainerLayers = (outerGroupId, page) => {
  const pageSettings = JSON.parse(page.getPluginData(PLUGIN_IDENTIFIER) || {});
  let containerGroupId = null;
  let boundingGroupId = null;
  let componentGroupId = null;
  let dimensionGroupId = null;
  let spacingGroupId = null;
  let styleGroupId = null;

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
  const containerGroup: any = figma.getNodeById(containerGroupId);
  if (containerGroup) {
    // always move bounding box group to bottom of list
    const boundingBoxGroup = figma.getNodeById(boundingGroupId);
    if (boundingBoxGroup) {
      containerGroup.appendChild(boundingBoxGroup);
    }

    // always move dimension annotations group to second from bottom of list
    const dimensionBoxGroup = figma.getNodeById(dimensionGroupId);
    if (dimensionBoxGroup) {
      containerGroup.appendChild(dimensionBoxGroup);
    }

    // always move spacing annotations group to third from bottom of list
    const spacingBoxGroup = figma.getNodeById(spacingGroupId);
    if (spacingBoxGroup) {
      containerGroup.appendChild(spacingBoxGroup);
    }

    // foundations group moves to second from top
    const styleGroup = figma.getNodeById(styleGroupId);
    if (styleGroup) {
      containerGroup.appendChild(styleGroup);
    }

    // always move component group to top of list
    const componentGroup = figma.getNodeById(componentGroupId);
    if (componentGroup) {
      containerGroup.appendChild(componentGroup);
    }
  }

  return null;
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
  let outerGroup = null;
  let outerGroupId = null;
  let outerGroupSet = null;
  let innerGroup = null;
  let innerGroupId = null;
  let containerSet: any = {};

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
    let updatedContainerSet: any = {};

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
    page.setPluginData(
      PLUGIN_IDENTIFIER,
      JSON.stringify(newPageSettings),
    );

    containerSet = updatedContainerSet;
  } else {
    containerSet = outerGroupSet;
  }

  if (outerGroup && innerGroup && layer) {
    // ensure the proper parent/child relationships are set in case container layers already exist
    outerGroup.appendChild(innerGroup);
    innerGroup.appendChild(layer);

    // move the outer container layer to the front
    frame.appendChild(outerGroup);

    // set the order of the inner container layers
    orderContainerLayers(outerGroup.id, page);
  }

  return containerSet;
};

/** WIP
 * @description Takes the data representing an existing annotation and removes that data
 * (and cleans up the data).
 *
 * @kind function
 * @name removeAnnotation
 *
 * @param {Object} existingItemData The data object containing an `id` representting the
 * annotation to be removed.
 */
const removeAnnotation = (existingItemData) => {
  const layerToDelete = figma.getNodeById(existingItemData.id);
  if (layerToDelete) {
    layerToDelete.remove();
  }
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
   * @description Locates annotation text in a layer’s Settings object and
   * builds the visual annotation on the Sketch frame.
   *
   * @kind function
   * @name addAnnotation
   * @returns {Object} A result object container success/error status and log/toast messages.
   */
  addAnnotation() {
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

    const layerSettings = getLayerSettings(this.page, this.layer.id);

    if (!layerSettings || (layerSettings && !layerSettings.annotationText)) {
      result.status = 'error';
      result.messages.log = 'Layer missing annotationText';
      return result;
    }

    // return an error if the selection is not placed on an frame
    if (!this.frame) {
      result.status = 'error';
      result.messages.log = 'Selection not on frame';
      result.messages.toast = 'Your selection needs to be on an frame';
      return result;
    }

    // set up some information
    const {
      annotationText,
      annotationSecondaryText,
      annotationType,
    } = layerSettings;
    const layerName = this.layer.name;
    const layerId = this.layer.id;
    const groupName = `Annotation for ${layerName}`;

    // retrieve document settings
    const pageSettings = JSON.parse(this.page.getPluginData(PLUGIN_IDENTIFIER) || {});

    // check if we have already annotated this element and remove the old annotation
    if (pageSettings && pageSettings.annotatedLayers) {
      // remove the old ID pair(s) from the `pageSettings` array
      pageSettings.annotatedLayers.forEach((layerSet) => {
        if (layerSet.originalId === layerId) {
          removeAnnotation(layerSet);

          // remove the layerSet from the `pageSettings` array
          let newPageSettings = JSON.parse(this.page.getPluginData(PLUGIN_IDENTIFIER));
          newPageSettings = updateArray(
            'annotatedLayers',
            { id: layerSet.id },
            newPageSettings,
            'remove',
          );

          // commit the settings update
          this.page.setPluginData(
            PLUGIN_IDENTIFIER,
            JSON.stringify(newPageSettings),
          );
        }
      });
    }

    // construct the base annotation elements
    const annotation = buildAnnotation(
      annotationText,
      annotationSecondaryText,
      annotationType,
    );

    // group and position the base annotation elements
    const layerIndex = this.layer.parent.children.findIndex(node => node === this.layer);
    const layerPosition = {
      frameWidth: this.frame.width,
      frameHeight: this.frame.height,
      width: this.layer.width,
      height: this.layer.height,
      x: this.layer.x,
      y: this.layer.y,
      index: layerIndex,
    };
    const group = positionAnnotation(
      this.frame,
      groupName,
      annotation,
      layerPosition,
    );

    // set it in the correct containers
    const containerSet = setLayerInContainers({
      layer: group,
      frame: this.frame,
      page: this.page,
      position: { x: this.layer.x, y: this.layer.y },
      type: annotationType,
    });

    // new object with IDs to add to settings
    const newAnnotatedLayerSet = {
      containerGroupId: containerSet.componentInnerGroupId,
      id: group.id,
      originalId: layerId,
    };

    // update the `newPageSettings` array
    let newPageSettings = JSON.parse(this.page.getPluginData(PLUGIN_IDENTIFIER) || {});
    newPageSettings = updateArray(
      'annotatedLayers',
      newAnnotatedLayerSet,
      newPageSettings,
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
    const containerSet = setLayerInContainers({
      layer: boundingBox,
      frame: this.frame,
      page: this.page,
      position,
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
}
