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
/**
 * @description Builds the initial annotation elements in Figma.
 *
 * @kind function
 * @name buildMeasureIcon
 *
 * @param {string} colorHex A string representing the hex color for the icon.
 * @param {string} orientation A string representing the orientation (optional).
 *
 * @returns {Object} FrameNode layer group containing the icon layers.
 * @private
 */
const buildMeasureIcon = (
  colorHex: string,
  orientation: 'horizontal' | 'vertical' = 'horizontal',
): FrameNode => {
  // with each color in decimal format: `{r: 1, g: 0.4, b: 0.4}`
  const color: { r: number, g: number, b: number } = hexToDecimalRgb(colorHex);
  const iconArray: Array<any> = [];

  // horizontal orientation lines
  let line1Params = {
    x: 0,
    y: 0,
    width: 1,
    height: 5,
  };
  let line2Params = {
    x: 9,
    y: 0,
    width: 1,
    height: 5,
  };
  let line3Params = {
    x: 1,
    y: 2,
    width: 8,
    height: 1,
  };

  let initialWidth = (line1Params.width + line2Params.width + line3Params.width);
  let initialHeight = line1Params.height;

  // vertical orientation lines
  if (orientation === 'vertical') {
    line1Params = {
      x: 0,
      y: 0,
      width: 5,
      height: 1,
    };
    line2Params = {
      x: 0,
      y: 9,
      width: 5,
      height: 1,
    };
    line3Params = {
      x: 2,
      y: 1,
      width: 1,
      height: 8,
    };

    initialWidth = line1Params.width;
    initialHeight = (line1Params.height + line2Params.height + line3Params.height);
  }

  // create the rectangles
  const line1: RectangleNode = figma.createRectangle();
  line1.name = 'Line 1';
  line1.fills = [{
    type: 'SOLID',
    color,
  }];
  line1.x = line1Params.x;
  line1.y = line1Params.y;
  line1.resize(line1Params.width, line1Params.height);
  iconArray.push(line1);

  const line2: RectangleNode = figma.createRectangle();
  line2.name = 'Line 2';
  line2.fills = [{
    type: 'SOLID',
    color,
  }];
  line2.x = line2Params.x;
  line2.y = line2Params.y;
  line2.resize(line2Params.width, line2Params.height);
  iconArray.push(line2);

  const line3: RectangleNode = figma.createRectangle();
  line3.name = 'Line 3';
  line3.fills = [{
    type: 'SOLID',
    color,
  }];
  line3.x = line3Params.x;
  line3.y = line3Params.y;
  line3.resize(line3Params.width, line3Params.height);
  iconArray.push(line3);

  // set constraints
  line1.constraints = {
    horizontal: 'MIN',
    vertical: 'STRETCH',
  };

  line2.constraints = {
    horizontal: 'MAX',
    vertical: 'STRETCH',
  };

  line3.constraints = {
    horizontal: 'STRETCH',
    vertical: 'CENTER',
  };

  if (orientation === 'vertical') {
    line1.constraints = {
      horizontal: 'STRETCH',
      vertical: 'MIN',
    };

    line2.constraints = {
      horizontal: 'STRETCH',
      vertical: 'MAX',
    };

    line3.constraints = {
      horizontal: 'CENTER',
      vertical: 'STRETCH',
    };
  }

  // create the icon frame
  const icon = figma.createFrame();
  icon.name = 'Icon';
  icon.backgrounds = [];
  icon.resize(initialWidth, initialHeight);
  iconArray.forEach((line) => { icon.appendChild(line); });

  return icon;
};

/**
 * @description Builds the initial annotation elements in Figma (diamond, rectangle, text).
 *
 * @kind function
 * @name buildAnnotation
 *
 * @param {Object} options Object that includes `text` – the text for the annotation,
 * `secondaryText` – optional secondary text for the annotation, and `type` – a string
 * representing the type of annotation (component or foundation).
 *
 * @returns {Object} Each annotation element as a layer node (`diamond`, `rectangle`, `text`,
 * and `icon`).
 *
 * @private
 */
const buildAnnotation = (options: {
  mainText: string,
  secondaryText?: string,
  type: 'component' | 'custom' | 'dimension' | 'spacing' | 'style',
}): {
  diamond: RectangleNode,
  rectangle: RectangleNode,
  text: TextNode,
  icon: FrameNode,
} => {
  const { mainText, secondaryText, type } = options;

  // set the dominant color
  let colorHex: string = null;
  switch (type) {
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

  let setText: string = mainText;
  if (secondaryText) {
    setText = `${mainText}\n${secondaryText}`;
  }

  let isMeasurement: boolean = false;
  if (
    type === 'spacing'
    || type === 'dimension'
  ) {
    isMeasurement = true;
  }

  // build the text box
  const textPosition: {
    x: number,
    y: number,
  } = {
    x: 16,
    y: 0,
  };

  if (isMeasurement) {
    textPosition.x = 3;
  }

  // adjustment for two-line annotations
  let textBuffer: number = 0;
  if (secondaryText) {
    textBuffer = 18;
  }

  // set up the color object
  // with each color in decimal format: `{r: 1, g: 0.4, b: 0.4}`
  const color: { r: number, g: number, b: number } = hexToDecimalRgb(colorHex);

  // build the rounded rectangle
  const rectHeight: number = (isMeasurement ? 18 : 30) + textBuffer;
  const rectangle: RectangleNode = figma.createRectangle();
  rectangle.name = 'Rectangle';

  // position and size the rectangle
  rectangle.x = 0;
  rectangle.y = 0;
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
  const diamondOffset: number = (isMeasurement ? 18 : 30);
  const diamond: RectangleNode = figma.createRectangle();
  diamond.name = 'Diamond';

  // position and size the diamond
  diamond.x = 0;
  diamond.y = diamondOffset + textBuffer;
  diamond.resize(6, 6);
  diamond.rotation = 45;

  // style it – set the diamond type, color, and opacity
  diamond.fills = [{
    type: 'SOLID',
    color,
  }];

  // create empty text layer
  const text: TextNode = figma.createText();

  // style text layer
  text.fontName = TYPEFACES.primary;
  text.fontSize = 12;
  text.lineHeight = { value: 18, unit: 'PIXELS' };
  text.fills = [{
    type: 'SOLID',
    color: hexToDecimalRgb('#ffffff'),
  }];

  // set text – cannot do this before defining `fontName`
  text.characters = setText;

  // position and size the text
  text.x = textPosition.x;
  text.y = textPosition.y;
  text.textAlignVertical = 'CENTER';
  text.textAlignHorizontal = 'CENTER';
  text.resize(text.width, rectHeight);
  text.textAutoResize = 'WIDTH_AND_HEIGHT';

  // adjust rectangle width based on text width
  const textWidth: number = text.width;
  const textPadding: number = (isMeasurement ? 6 : 32);
  const rectangleWidth: number = textWidth + textPadding;
  rectangle.resize(rectangleWidth, rectangle.height);

  // move the text to the mid-point of the rectangle
  text.x = rectangle.x + (textPadding / 2);

  // move the diamond to the mid-point of the rectangle
  const diamondMidX: number = ((rectangleWidth - 9) / 2);
  diamond.x = diamondMidX;

  // create icon
  let icon: FrameNode = null;
  if (isMeasurement) {
    icon = buildMeasureIcon(colorHex);
  }

  // return an object with each element
  return {
    diamond,
    rectangle,
    text,
    icon,
  };
};

/**
 * @description Builds the rectangle shape styled as a bounding box.
 *
 * @kind function
 * @name buildBoundingBox
 *
 * @param {Object} position The frame coordinates (`x`, `y`, `width`, and `height`) for the box.
 *
 * @returns {Object} The Figma RectangleNode object for the box.
 * @private
 */
const buildBoundingBox = (position: {
  x: number,
  y: number,
  width: number,
  height: number,
}): RectangleNode => {
  const colorHex: string = COLORS.style;
  const colorOpactiy: number = 0.3; // 30% opacity

  // build and name the initial rectangle object
  const boundingBox: RectangleNode = figma.createRectangle();
  boundingBox.name = 'Bounding Box';

  // position and size the rectangle
  boundingBox.x = position.x;
  boundingBox.y = position.y;
  boundingBox.resize(position.width, position.height);

  // set up the color object
  // with each color in decimal format: `{r: 1, g: 0.4, b: 0.4}`
  const color: { r: number, g: number, b: number } = hexToDecimalRgb(colorHex);

  // style it – set the rectangle type, color, and opacity
  boundingBox.fills = [{
    type: 'SOLID',
    color,
    opacity: colorOpactiy,
  }];

  return boundingBox;
};

/**
 * @description Takes the individual annotation elements, the specs for the layer(s) receiving
 * the annotation, and adds the annotation to the container group in the proper position.
 *
 * @kind function
 * @name positionAnnotation
 *
 * @param {Object} frame The Figma `frame` that contains the annotation.
 * @param {string} groupName The name of the group that holds the annotation elements
 * inside the `containerGroup`.
 * @param {Object} annotation Each annotation element (`diamond`, `rectangle`, `text`, and `icon`).
 * @param {Object} layerPosition The position specifications (`width`, `height`, `x`, `y`, `index`)
 * for the layer receiving the annotation + the frame width/height (`frameWidth` /
 * `frameHeight`).
 * @param {string} annotationType An optional string representing the type of annotation.
 * @param {string} orientation An optional string representing the orientation of the
 * annotation (`top` or `left`).
 *
 * @returns {Object} The final annotation as a layer group.
 * @private
 */
const positionAnnotation = (
  frame: FrameNode,
  groupName: string,
  annotation: {
    diamond: RectangleNode,
    rectangle: RectangleNode,
    text: TextNode,
    icon: FrameNode,
  },
  layerPosition: {
    frameWidth: number,
    frameHeight: number,
    width: number,
    height: number,
    x: number,
    y: number,
    index: number,
  },
  annotationType: 'component' | 'custom' | 'dimension' | 'spacing' | 'style' = 'component',
  orientation: 'top' | 'bottom' | 'right' | 'left' = 'top',
) => {
  const {
    diamond,
    rectangle,
    text,
    icon,
  } = annotation;

  const { frameWidth, frameHeight } = layerPosition;
  const layerWidth: number = layerPosition.width;
  const layerHeight: number = layerPosition.height;
  const layerX: number = layerPosition.x;
  const layerY: number = layerPosition.y;

  let isMeasurement: boolean = false;
  if (
    annotationType === 'spacing'
    || annotationType === 'dimension'
  ) {
    isMeasurement = true;
  }

  // create the annotation group
  const groupArray: Array<any> = [];
  if (rectangle) { groupArray.push(rectangle); }
  if (diamond) { groupArray.push(diamond); }
  if (text) { groupArray.push(text); }
  if (icon) { groupArray.push(icon); }

  const group: FrameNode = figma.group(groupArray, frame);
  group.name = groupName;

  // ------- position the group within the frame, above the layer receiving the annotation
  let frameEdge: string = null;

  // initial placement based on layer to annotate

  // for top
  let placementX: number = (
    layerX + (
      (layerWidth - rectangle.width) / 2
    )
  );
  // for `left` or `right`
  let placementY: number = (
    layerY + (
      (layerHeight - rectangle.height) / 2
    )
  );

  let offsetX: number = null;
  let offsetY: number = null;
  let iconOffsetX: number = 0;
  let iconOffsetY: number = 0;

  // adjustments based on orientation
  switch (orientation) {
    case 'left':
      offsetX = (isMeasurement ? 36 : 38);
      placementX = layerX - offsetX;
      break;
    case 'right':
      offsetX = (isMeasurement ? 12 : 5);
      placementX = layerX + layerWidth + offsetX;
      break;
    default: // top
      offsetY = (isMeasurement ? 15 : 8);
      placementY = layerY - rectangle.height - offsetY;
  }

  // correct for left bleed
  if (placementX < 0) {
    frameEdge = 'left';
    placementX = 5;

    // dimension/spacing annotations get their own special correction
    if (icon) {
      iconOffsetX = placementX;
    }
  }

  // correct for right bleed
  if ((placementX + group.width) > frameWidth) {
    frameEdge = 'right';
    placementX = frameWidth - group.width - 3;

    // dimension/spacing annotations get their own special correction
    if (icon) {
      placementX -= 3;
      iconOffsetX = placementX;
    }
  }

  // correct for top bleed
  if (placementY < 0) {
    frameEdge = 'top';
    placementY = 5;

    // dimension/spacing annotations get their own special correction
    if (icon) {
      placementY = 2;
      iconOffsetY = placementY;
    }
  }

  // correct for bottom bleed
  if (placementY > (frameHeight - group.height)) {
    frameEdge = 'bottom';
    offsetY = icon ? 2 : 5;
    placementY = (frameHeight - group.height - offsetY);

    if (icon) {
      iconOffsetY = null;
    }
  }

  // set annotation group placement, relative to container group
  group.x = placementX;
  group.y = placementY;

  // adjust diamond on horizonal placement, if necessary
  if (frameEdge) {
    // move the diamond to the mid-point of the layer to annotate
    let diamondLayerMidX: number = null;
    switch (frameEdge) {
      case 'left':
        diamondLayerMidX = ((layerX - group.x) + ((layerWidth + diamond.width + 6) / 2));
        break;
      case 'right':
        diamondLayerMidX = layerX - ((diamond.width + 6) / 2);
        break;
      default:
        diamondLayerMidX = diamond.x;
    }
    diamond.x = diamondLayerMidX;
  }

  // move diamond to left/right edge, if necessary
  if (orientation === 'left' || orientation === 'right') {
    const diamondNewY: number = rectangle.y + (rectangle.height / 2);
    let diamondNewX: number = null;

    if (orientation === 'left') {
      // move the diamond to the left mid-point of the layer to annotate
      diamondNewX = rectangle.x + rectangle.width - 4;
    } else {
      // move the diamond to the right mid-point of the layer to annotate
      diamondNewX = rectangle.x - 4;
    }

    // re-position diamond
    diamond.x = diamondNewX;
    diamond.y = diamondNewY;
  }

  // adjust the measure icon width for top-oriented annotations
  if (orientation === 'top' && icon) {
    icon.y += 26;
    icon.resize(layerWidth, icon.height);

    if (iconOffsetX > 0) {
      if (frameEdge === 'left') {
        icon.x -= icon.x;
      } else {
        icon.x = frameWidth - icon.width;
      }
    } else {
      icon.x += (rectangle.width - layerWidth) / 2;
    }
  }

  // adjust the measure icon height for left-/right-oriented annotations
  if (orientation !== 'top') {
    // remove horizontal icon (easier to re-draw)
    icon.remove();

    // redraw icon in vertical orientation
    const measureIconColor: string = (annotationType === 'spacing' ? COLORS.spacing : COLORS.dimension);
    const iconNew: FrameNode = buildMeasureIcon(measureIconColor, 'vertical');

    // add back into group
    group.appendChild(iconNew);

    // resize icon based on gap/layer height
    iconNew.resize(iconNew.width, layerHeight);

    // position icon on `y`
    if (iconOffsetY !== null) {
      if (iconOffsetY > 0) {
        // move the icon back to the top of the frame
        iconNew.y -= iconNew.y;
      } else {
        iconNew.y = layerPosition.y;
      }
    } else {
      iconNew.y = group.height - iconNew.height;
    }

    // position icon on `x` based on orientation
    if (orientation === 'right') {
      iconNew.x = rectangle.x - 10;
    } else {
      iconNew.x = rectangle.x + rectangle.width + 4;
    }
  }

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
const setGroupKey = (elementType: string):
  'boundingInnerGroupId'
  | 'componentInnerGroupId'
  | 'dimensionInnerGroupId'
  | 'spacingInnerGroupId'
  | 'styleInnerGroupId'
  | 'id' => {
  let groupKey:
    'boundingInnerGroupId'
    | 'componentInnerGroupId'
    | 'dimensionInnerGroupId'
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
 *
 * @returns {string} A text label based on the spacing value.
 * @private
 */
const retrieveSpacingValue = (length: number): number => {
  let itemSpacingValue: number = null;

  // IS-X spacing is not an even scale
  // set some breakpoints and “round” `length` to the nearest proper IS-X number
  // ignore anything so large that it’s above `IS-9`
  switch (true) {
    case (length >= 128): // based on 160 – IS-10 (not actually specc'd in Art Deco)
      return itemSpacingValue;
    case (length >= 80): // 96 – IS-9
      itemSpacingValue = 9;
      break;
    case (length >= 56): // 64 – IS-8
      itemSpacingValue = 8;
      break;
    case (length >= 40): // 48 – IS-7
      itemSpacingValue = 7;
      break;
    case (length >= 28): // 32 – IS-6
      itemSpacingValue = 6;
      break;
    case (length >= 20): // 24 – IS-5
      itemSpacingValue = 5;
      break;
    case (length >= 16): // 16 – IS-4
      itemSpacingValue = 4;
      break;
    default:
      itemSpacingValue = Math.round(length / 4);
  }

  return itemSpacingValue;
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
 * @returns {null}
 *
 * @private
 */
const orderContainerLayers = (outerGroupId: string, page): void => {
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
 * @description Sets up the individual elements for a container group (inner or outer) and
 * adds the child layer to the group.
 *
 * @kind function
 * @name drawContainerGroup
 *
 * @param {Object} groupSettings Object containing the `name`, `position`,
 * `child` and `parent` layers, and `locked` status.
 *
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
}): FrameNode => {
  const {
    name,
    position,
    parent,
    child,
    locked,
  } = groupSettings;

  // set new group
  const containerGroup: FrameNode = figma.group([child], parent);

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
 *
 * @param {Object} containerSet An instance of the parent container group’s settings object.
 * @param {string} groupType A string representing the type of element going inside the continer.
 * @param {Object} frame An object representing the top-level Figma Frame for the container group.
 * @param {Object} layer An object representing the Figma layer to be set in the container group.
 *
 * @returns {Object} The inner container group layer object and the accompanying
 * updated parent container group settings object.
 * @private
 */
export const createContainerGroup = (
  containerSet: {
    boundingInnerGroupId?: string,
    componentInnerGroupId?: string,
    dimensionInnerGroupId?: string,
    frameId: string,
    spacingInnerGroupId?: string,
    styleInnerGroupId?: string,
  },
  groupType:
    'boundingBox'
    | 'component'
    | 'custom'
    | 'dimension'
    | 'spacing'
    | 'style'
    | 'topLevel',
  frame: FrameNode,
  layer: SceneNode,
): {
  newInnerGroup: FrameNode,
  updatedContainerSet: {
    boundingInnerGroupId?: string,
    componentInnerGroupId?: string,
    dimensionInnerGroupId?: string,
    frameId: string,
    spacingInnerGroupId?: string,
    styleInnerGroupId?: string,
  },
} => {
  const groupName: string = setGroupName(groupType);
  const groupKey: string = setGroupKey(groupType);
  const locked: boolean = groupType === 'topLevel';

  // set up new container group layer on the frame
  const newInnerGroup: FrameNode = drawContainerGroup({
    name: groupName,
    position: { x: layer.x, y: layer.y },
    parent: frame,
    child: layer,
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
 * @description Sets (finds or builds) the parent container group(s), places the layer in the
 * container(s) and updates the document settings (if a new container group has been created).
 *
 * @kind function
 * @name setLayerInContainers
 * @param {Object} layerToContain An object including the `layer` that needs placement,
 * the `frame` and `page` the layer exists within, the `position` of the layer, and the
 * `type` of annotation or drawing action.
 *
 * @returns {boolean} `true` if the layer was placed successfully, otherwise `false`.
 * @private
 */
const setLayerInContainers = (layerToContain: {
  layer: SceneNode,
  frame: FrameNode,
  page: PageNode,
  type:
    'boundingBox'
    | 'component'
    | 'custom'
    | 'dimension'
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
    layer,
    frame,
    page,
    type,
  } = layerToContain;
  const groupKey = setGroupKey(type);
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
  const layerToDelete = figma.getNodeById(existingItemData.id);
  if (layerToDelete) {
    layerToDelete.remove();
  }
  return null;
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
 * @property layer The SceneNode in the Figma file that we want to annotate or modify.
 * @property frame The top-level FrameNode in the Figma file that we want to annotate or modify.
 * @property page The PageNode in the Figma file containing the corresponding `frame` and `layer`.
 */
export default class Painter {
  layer: SceneNode;
  frame: FrameNode;
  page: PageNode;
  constructor({ for: layer, in: page }) {
    this.layer = layer;
    this.frame = findFrame(this.layer);
    this.page = page;
  }

  /**
   * @description Locates annotation text in a layer’s Settings object and
   * builds the visual annotation on the Figma frame.
   *
   * @kind function
   * @name addAnnotation
   *
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
    const pageSettings = JSON.parse(this.page.getPluginData(PLUGIN_IDENTIFIER) || null);

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
    const annotation = buildAnnotation({
      mainText: annotationText,
      secondaryText: annotationSecondaryText,
      type: annotationType,
    });

    // group and position the base annotation elements
    const layerIndex: number = this.layer.parent.children.findIndex(node => node === this.layer);
    const layerPosition: {
      frameWidth: number,
      frameHeight: number,
      width: number,
      height: number,
      x: number,
      y: number,
      index: number,
    } = {
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
      type: annotationType,
    });

    // new object with IDs to add to settings
    const newAnnotatedLayerSet: {
      containerGroupId: string,
      id: string,
      originalId: string,
    } = {
      containerGroupId: containerSet.componentInnerGroupId,
      id: group.id,
      originalId: layerId,
    };

    // update the `newPageSettings` array
    let newPageSettings = JSON.parse(this.page.getPluginData(PLUGIN_IDENTIFIER) || null);
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
    const containerSet = setLayerInContainers({
      layer: boundingBox,
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
   * @description Takes a layer and creates two dimension annotations with the layer’s
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

    // return an error if the selection is not placed on an frame
    if (!this.frame) {
      result.status = 'error';
      result.messages.log = 'Selection not on frame';
      result.messages.toast = 'Your selection needs to be on a frame';
      return result;
    }

    // set up some information
    const annotationType = 'dimension';
    const layerId = this.layer.id;
    const layerName = this.layer.name;

    // retrieve document settings
    const pageSettings = JSON.parse(this.page.getPluginData(PLUGIN_IDENTIFIER) || null);

    // check if we have already annotated this element and remove the old annotation
    if (pageSettings && pageSettings.annotatedDimensions) {
      // remove the old ID pair(s) from the `newPageSettings` array
      pageSettings.annotatedDimensions.forEach((layerSet) => {
        if (layerSet.originalId === layerId) {
          removeAnnotation(layerSet);

          // remove the layerSet from the `pageSettings` array
          let newPageSettings = JSON.parse(this.page.getPluginData(PLUGIN_IDENTIFIER));
          newPageSettings = updateArray(
            'annotatedDimensions',
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

    // group and position the annotation elements
    const layerIndex: number = this.layer.parent.children.findIndex(node => node === this.layer);
    const layerPosition: {
      frameWidth: number,
      frameHeight: number,
      width: number,
      height: number,
      x: number,
      y: number,
      index: number,
    } = {
      frameWidth: this.frame.width,
      frameHeight: this.frame.height,
      width: this.layer.width,
      height: this.layer.height,
      x: this.layer.x,
      y: this.layer.y,
      index: layerIndex,
    };

    // ------------------------
    // construct the width annotation elements
    const annotationTextWidth: string = `${this.layer.width}dp`;
    const groupNameWidth: string = `Dimension Width for layer ${layerName}`;
    const annotationWidth = buildAnnotation({
      mainText: annotationTextWidth,
      type: annotationType,
    });

    const annotationOrientation = 'top';
    const groupWidth = positionAnnotation(
      this.frame,
      groupNameWidth,
      annotationWidth,
      layerPosition,
      annotationType,
      annotationOrientation,
    );

    // set it in the correct containers
    const containerSetWidth = setLayerInContainers({
      layer: groupWidth,
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
      originalId: layerId,
    };

    // update the `newPageSettings` array
    let newPageSettings = JSON.parse(this.page.getPluginData(PLUGIN_IDENTIFIER) || null);
    newPageSettings = updateArray(
      'annotatedDimensions',
      newAnnotatedDimensionSetWidth,
      newPageSettings,
      'add',
    );

    // ------------------------
    // construct the height annotation elements
    const annotationTextHeight: string = `${this.layer.height}dp`;
    const groupNameHeight: string = `Dimension Height for layer ${layerName}`;
    const annotationHeight = buildAnnotation({
      mainText: annotationTextHeight,
      type: annotationType,
    });

    const annotationOrientationHeight = 'right';
    const groupHeight = positionAnnotation(
      this.frame,
      groupNameHeight,
      annotationHeight,
      layerPosition,
      annotationType,
      annotationOrientationHeight,
    );

    // set it in the correct containers
    const containerSetHeight = setLayerInContainers({
      layer: groupHeight,
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
      originalId: layerId,
    };

    // update the `newPageSettings` array
    newPageSettings = updateArray(
      'annotatedDimensions',
      newAnnotatedDimensionSetHeight,
      newPageSettings,
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
    result.messages.log = `Dimensions annotated for “${this.layer.name}”`;
    return result;
  }

  /**
   * @description Takes a `spacingPosition` object and creates a spacing measurement annotation
   * with the correct spacing number (“IS-X”). If the calculated spacing number is larger
   * than “IS-9”, the annotation is not created.
   *
   * @kind function
   * @name addSpacingAnnotation
   *
   * @param {Object} spacingPosition The `x`, `y` coordinates, `width`, `height`, and `orientation`
   * of an entire selection. It should also includes layer IDs (`layerAId` and `layerBId`)
   * for the two layers used to calculated the gap.
   *
   * @returns {null}
   */
  addSpacingAnnotation(spacingPosition) {
    // set up some information
    const measurementToUse = spacingPosition.orientation === 'vertical' ? spacingPosition.width : spacingPosition.height;
    const spacingValue = retrieveSpacingValue(measurementToUse);

    // if there is no `spacingValue`, the measurement is above an `IS-9` and isn’t considered valid
    if (!spacingValue) {
      return null;
    }

    const annotationText: string = `IS-${spacingValue}`;
    const annotationType = 'spacing';
    const layerName: string = this.layer.name;
    const groupName: string = `Spacing for ${layerName} (${spacingPosition.direction})`;

    // retrieve document settings
    const pageSettings = JSON.parse(this.page.getPluginData(PLUGIN_IDENTIFIER) || null);

    // check if we have already annotated this element and remove the old annotation
    if (pageSettings && pageSettings.annotatedSpacings) {
      // remove the old ID pair(s) from the `newPageSettings` array
      pageSettings.annotatedSpacings.forEach((layerSet) => {
        if (
          layerSet.layerAId === spacingPosition.layerAId
          && layerSet.layerBId === spacingPosition.layerBId
          && layerSet.direction === spacingPosition.direction
        ) {
          removeAnnotation(layerSet);

          // remove the layerSet from the `pageSettings` array
          let newPageSettings = JSON.parse(this.page.getPluginData(PLUGIN_IDENTIFIER));
          newPageSettings = updateArray(
            'annotatedSpacings',
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
    const annotation = buildAnnotation({
      mainText: annotationText,
      type: annotationType,
    });

    // group and position the base annotation elements
    const layerIndex: number = this.layer.parent.children.findIndex(node => node === this.layer);
    const layerPosition: {
      frameWidth: number,
      frameHeight: number,
      width: number,
      height: number,
      x: number,
      y: number,
      index: number,
    } = {
      frameWidth: this.frame.width,
      frameHeight: this.frame.height,
      width: spacingPosition.width,
      height: spacingPosition.height,
      x: spacingPosition.x,
      y: spacingPosition.y,
      index: layerIndex,
    };

    const annotationOrientation = (spacingPosition.orientation === 'vertical' ? 'top' : 'left');
    const group = positionAnnotation(
      this.frame,
      groupName,
      annotation,
      layerPosition,
      annotationType,
      annotationOrientation,
    );

    // set it in the correct containers
    const containerSet = setLayerInContainers({
      layer: group,
      frame: this.frame,
      page: this.page,
      type: annotationType,
    });

    // new object with IDs to add to settings
    const newAnnotatedSpacingSet: {
      containerGroupId: string,
      id: string,
      layerAId: string,
      layerBId: string,
      direction: 'top' | 'bottom' | 'right' | 'left',
    } = {
      containerGroupId: containerSet.componentInnerGroupId,
      id: group.id,
      layerAId: spacingPosition.layerAId,
      layerBId: spacingPosition.layerBId,
      direction: spacingPosition.direction,
    };

    // update the `newPageSettings` array
    let newPageSettings = JSON.parse(this.page.getPluginData(PLUGIN_IDENTIFIER) || null);
    newPageSettings = updateArray(
      'annotatedSpacings',
      newAnnotatedSpacingSet,
      newPageSettings,
      'add',
    );

    // commit the `Settings` update
    this.page.setPluginData(
      PLUGIN_IDENTIFIER,
      JSON.stringify(newPageSettings),
    );

    return null;
  }

  /**
   * @description Takes a `spacingPosition` object from Crawler and creates a spacing measurement
   * annotation with the correct spacing number (“IS-X”).
   *
   * @kind function
   * @name addGapMeasurement
   *
   * @param {Object} spacingPosition The `x`, `y` coordinates, `width`, `height`, and `orientation`
   * of an entire selection. It should also includes layer IDs (`layerAId` and `layerBId`)
   * for the two layers used to calculated the gap.
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

    // return an error if the selection is not placed on an artboard
    if (!this.frame) {
      result.status = 'error';
      result.messages.log = 'Selection not on artboard';
      result.messages.toast = 'Your selection needs to be on an artboard';
      return result;
    }

    // return an error if the selection is not placed on an artboard
    if (!spacingPosition) {
      result.status = 'error';
      result.messages.log = 'spacingPosition is missing';
      result.messages.toast = 'Could not find a gap in your selection';
      return result;
    }

    // set direction (type)
    spacingPosition.direction = 'gap'; // eslint-disable-line no-param-reassign

    // add the annotation
    this.addSpacingAnnotation(spacingPosition);

    // return a successful result
    result.status = 'success';
    result.messages.log = `Spacing annotated for “${this.layer.name}”`;
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
   * layer IDs (`layerAId` and `layerBId`) for the two layers used to calculated the
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

    // return an error if the selection is not placed on an artboard
    if (!this.frame) {
      result.status = 'error';
      result.messages.log = 'Selection not on artboard';
      result.messages.toast = 'Your selection needs to be on an artboard';
      return result;
    }

    // return an error if the selection is not placed on an artboard
    if (!overlapFrames) {
      result.status = 'error';
      result.messages.log = 'overlapFrames is missing';
      result.messages.toast = 'Could not find a overlapped layers in your selection';
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

      const spacingPosition: {
        x: number,
        y: number,
        width: number,
        height: number,
        orientation: 'horizontal' | 'vertical',
        layerAId: string,
        layerBId: string,
        direction: 'top' | 'bottom' | 'right' | 'left',
      } = {
        x: frameX,
        y: frameY,
        width: overlapFrames[direction].width,
        height: overlapFrames[direction].height,
        orientation: overlapFrames[direction].orientation,
        layerAId: overlapFrames.layerAId,
        layerBId: overlapFrames.layerBId,
        direction,
      };

      return this.addSpacingAnnotation(spacingPosition);
    });

    // return a successful result
    result.status = 'success';
    result.messages.log = `Spacing (${directions.join(', ')}) annotated for “${this.layer.name}”`;
    return result;
  }
}
