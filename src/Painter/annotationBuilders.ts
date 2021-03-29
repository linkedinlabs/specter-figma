import {
  COLORS,
  DATA_KEYS,
  KEY_OPTS,
  ROLE_OPTS,
} from '../constants';
import { getLegendFrame } from '../utils/nodeGetters';
import { hexToDecimalRgb } from '../utils/tools';

// --- private functions for drawing/positioning annotation elements in the Figma file

/**
 * @description Builds the spacing/measure annotation elements in Figma.
 *
 * @kind function
 * @name buildMeasureIcon
 *
 * @param {string} colorHex A string representing the hex color for the icon.
 * @param {string} orientation A string representing the orientation (optional).
 *
 * @returns {Object} FrameNode node group containing the icon nodes.
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
  icon.fills = [];
  icon.layoutAlign = 'STRETCH';
  icon.resize(initialWidth, initialHeight);
  iconArray.forEach((line) => { icon.appendChild(line); });

  return icon;
};

/**
 * @description Builds the keystop icon.
 *
 * @kind function
 * @name buildKeystopIcon
 *
 * @param {Object} color An object representing a color in RGB decimal notation.
 *
 * @returns {Object} The icon FrameNode.
 *
 * @private
 */
const buildKeystopIcon = (
  color: { r: number, g: number, b: number },
): FrameNode => {
  const icon: FrameNode = figma.createFrame();

  // build horizontal rectangle
  const rectangle1: RectangleNode = figma.createRectangle();
  rectangle1.name = 'Rectangle';
  rectangle1.resize(26, 2);
  rectangle1.fills = [{
    type: 'SOLID',
    color,
  }];

  // build verticle rectangle
  const rectangle2: RectangleNode = figma.createRectangle();
  rectangle2.name = 'Rectangle';
  rectangle2.resize(2, 8);
  rectangle2.fills = [{
    type: 'SOLID',
    color,
  }];

  // build the diamond
  let diamond: PolygonNode | VectorNode = figma.createPolygon();
  diamond.name = 'Diamond';

  // position and size the diamond
  diamond.resize(9, 6);
  diamond.rotation = -90;
  diamond.pointCount = 3;

  // style it – set the diamond type, color, and opacity
  diamond.fills = [{
    type: 'SOLID',
    color,
  }];

  // flatten and add to the icon frame
  diamond = figma.flatten([diamond], icon);

  // resize as flattened vector + position
  diamond.resize(5, 8);
  diamond.x = 0;
  diamond.y = 0;

  rectangle2.x = 5;
  rectangle2.y = 0;

  rectangle1.resize(30, rectangle1.height);
  icon.appendChild(rectangle1);

  const shape = figma.flatten([diamond, rectangle2], icon);
  shape.name = 'Step Forward Icon';

  // style the icon frame
  icon.name = 'Tab Stop Icon';
  icon.fills = [];

  // set initial size
  icon.resize(34, 8);

  // auto-layout
  icon.layoutMode = 'HORIZONTAL';
  icon.primaryAxisSizingMode = 'AUTO';
  icon.counterAxisAlignItems = 'CENTER';
  icon.counterAxisSizingMode = 'AUTO';
  icon.primaryAxisAlignItems = 'MAX';
  icon.layoutAlign = 'INHERIT';
  icon.layoutGrow = 0;

  rectangle1.layoutAlign = 'INHERIT';
  rectangle1.layoutGrow = 1;

  // set constraints
  shape.constraints = {
    horizontal: 'MAX',
    vertical: 'MIN',
  };
  rectangle1.constraints = {
    horizontal: 'STRETCH',
    vertical: 'MIN',
  };

  return icon;
};

/**
 * @description Builds the keystop arrow icon used in the arrow key annotations.
 *
 * @kind function
 * @name buildKeystopArrowIcon
 *
 * @param {Object} color An object representing a color in RGB decimal notation.
 *
 * @returns {Object} The icon FrameNode.
 *
 * @private
 */
const buildKeystopArrowIcon = (
  color: { r: number, g: number, b: number },
): FrameNode => {
  const icon: FrameNode = figma.createFrame();

  // build horizontal rectangle
  const rectangle1: RectangleNode = figma.createRectangle();
  rectangle1.name = 'Rectangle';
  rectangle1.resize(12, 2);
  rectangle1.y = 3;
  rectangle1.fills = [{
    type: 'SOLID',
    color,
  }];

  // build the diamond
  let diamond: PolygonNode | VectorNode = figma.createPolygon();
  diamond.name = 'Diamond';

  // position and size the diamond
  diamond.resize(9, 6);
  diamond.rotation = -90;
  diamond.pointCount = 3;

  // style it – set the diamond type, color, and opacity
  diamond.fills = [{
    type: 'SOLID',
    color,
  }];

  // flatten and add to the icon frame
  diamond = figma.flatten([diamond], icon);

  // resize as flattened vector + position
  diamond.resize(5, 8);
  diamond.x = 12;
  diamond.y = 0;

  const shape = figma.flatten([rectangle1, diamond], icon);
  shape.name = 'Arrow Vector';
  shape.x = 0;

  icon.appendChild(shape);

  // style the icon frame
  icon.name = 'Arrow Icon';
  icon.fills = [];
  icon.resize(shape.width, shape.height);

  return icon;
};

/**
 * @description Builds the initial text element in Figma and sets auto-layout
 * and constraint properties. Tweaks are made based on the `type`.
 *
 * @kind function
 * @name buildText
 *
 * @param {string} type The type of annotation the text will be used in.
 * @param {Object} color An object representing a color in RGB decimal notation.
 * @param {string} characters The text that will be set to the node.
 * @param {boolean} isError Whether the text is error text and should be red.
 *
 * @returns {Object} The text TextNode.
 *
 * @private
 */
const buildText = (
  type:
    'component'
    | 'custom'
    | 'dimension'
    | 'keystop'
    | 'label'
    | 'heading'
    | 'legend'
    | 'spacing'
    | 'style',
  color: { r: number, g: number, b: number },
  characters: string,
  isError?: boolean,
): TextNode => {
  const text: TextNode = figma.createText();
  const typefaceToUse: FontName = JSON.parse(figma.currentPage.getPluginData('typefaceToUse'));

  text.fontName = typefaceToUse;
  text.fontSize = 12;
  text.lineHeight = { value: 125, unit: 'PERCENT' };
  text.fills = [{
    type: 'SOLID',
    color: isError ? { r: 1, g: 0, b: 0 } : color,
  }];

  text.layoutAlign = 'INHERIT';
  text.layoutGrow = 0;

  // set text – cannot do this before defining `fontName`
  text.characters = characters;

  // position the text in the frame
  text.textAlignVertical = 'CENTER';
  text.textAlignHorizontal = 'CENTER';
  text.textAutoResize = 'WIDTH_AND_HEIGHT';

  // ------- update text for certain annotations
  if (type === 'keystop') {
    text.fontSize = 14;
    text.textAlignHorizontal = 'LEFT';
    text.textAutoResize = 'WIDTH_AND_HEIGHT';
    text.layoutAlign = 'INHERIT';
    text.locked = true;
  } else if (['label', 'heading'].includes(type)) {
    text.fontSize = 14;
    text.lineHeight = { value: 100, unit: 'PERCENT' };
    text.textCase = 'UPPER';
    text.locked = true;
  } else if (type === 'legend') {
    text.fontSize = 12;
    text.lineHeight = { value: 135, unit: 'PERCENT' };
    text.textAlignVertical = 'TOP';
    text.textAlignHorizontal = 'LEFT';
    text.textCase = 'ORIGINAL';
    text.locked = true;
    text.fontName = !characters.includes(':')
      ? { family: typefaceToUse.family, style: 'Regular' } : typefaceToUse;
    if (!characters.includes(':')) {
      text.resize(225, text.height);
    }
  }
  return text;
};

/**
 * @description Builds an inner rectangle element in Figma for label annotations.
 *
 * @kind function
 * @name buildRectangleInnerHalf
 *
 * @param {string} align Indicates whether the frame should be left or right aligned.
 * @param {Object} color An object that represents a color in RGB decimal notation.
 * @param {boolean} isLegendIcon An indicator of whether this is for a legend icon.
 *
 * @returns {Object} The inner rectangle FrameNode for the annotation.
 */
const buildRectangleInnerHalf = (
  align: 'left' | 'right',
  color: { r: number, g: number, b: number },
  isLegendIcon?: boolean,
): FrameNode => {
  // set inner half frames for label annotation
  const frame: FrameNode = figma.createFrame();
  frame.name = `${align.charAt(0).toUpperCase()}${align.slice(1)} Half`;

  // auto-layout
  frame.layoutMode = 'HORIZONTAL';
  frame.primaryAxisSizingMode = 'AUTO';
  frame.primaryAxisAlignItems = 'SPACE_BETWEEN';
  frame.counterAxisSizingMode = 'FIXED';
  frame.counterAxisAlignItems = 'CENTER';
  frame.layoutAlign = 'STRETCH';
  frame.layoutGrow = 0;

  // set padding and item spacing
  const paddingPx = align === 'left' ? 5 : 5;
  frame.paddingLeft = paddingPx;
  frame.paddingRight = paddingPx;
  frame.paddingTop = 2;
  frame.paddingBottom = 2;
  frame.itemSpacing = 0;
  frame.fills = [{
    type: 'SOLID',
    color,
  }];

  if (align === 'right' && !isLegendIcon) {
    // set rounded corners of the rectangle
    frame.topRightRadius = 3;
    frame.bottomRightRadius = 3;
  }
  return frame;
};

/**
 * @description Builds the initial recntangle element in Figma and sets auto-layout
 * and constraint properties. Tweaks are made based on the `type`.
 *
 * @kind function
 * @name buildRectangle
 *
 * @param {string} type The type of annotation the rectange will be used in.
 * @param {Object} color An object representing a color in RGB decimal notation.
 * @param {string} innerText An optional string to accept inner rectangle text for labels.
 * @param {boolean} isLegendIcon A flag indicating whether the rectangle is for a legend icon.
 *
 * @returns {Object} The rectangle FrameNode.
 */
const buildRectangle = (
  type:
    'component'
    | 'custom'
    | 'dimension'
    | 'keystop'
    | 'label'
    | 'heading'
    | 'spacing'
    | 'style',
  color: { r: number, g: number, b: number },
  innerText?: string,
  isLegendIcon?: boolean,
): FrameNode => {
  // build base rectangle (used for most annotations)
  const rectangle: FrameNode = figma.createFrame();
  rectangle.name = 'Box / Text';

  // auto-layout
  rectangle.layoutMode = 'HORIZONTAL';
  rectangle.primaryAxisSizingMode = 'AUTO';
  rectangle.primaryAxisAlignItems = 'SPACE_BETWEEN';
  rectangle.counterAxisSizingMode = 'AUTO';
  rectangle.counterAxisAlignItems = 'CENTER';
  rectangle.layoutAlign = 'INHERIT';
  rectangle.layoutGrow = 0;

  // set padding and item spacing
  rectangle.paddingLeft = 16;
  rectangle.paddingRight = 16;
  rectangle.paddingTop = 4.5;
  rectangle.paddingBottom = 6;
  rectangle.itemSpacing = 0;

  // style it – set the rectangle type, color, and opacity
  rectangle.fills = [{
    type: 'SOLID',
    color,
  }];

  // set rounded corners of the rectangle
  rectangle.cornerRadius = 2;

  // ------- update rectangle for measurement annotations
  if (
    type === 'spacing'
    || type === 'dimension'
  ) {
    rectangle.paddingLeft = 3;
    rectangle.paddingRight = 3;
    rectangle.paddingTop = 0.5;
    rectangle.paddingBottom = 2;
  } else if (type === 'keystop') {
    // ------- update rectangle for keystop annotations
    if (!isLegendIcon) {
      rectangle.layoutMode = 'VERTICAL';
      rectangle.primaryAxisSizingMode = 'AUTO';
      rectangle.primaryAxisAlignItems = 'SPACE_BETWEEN';
      rectangle.counterAxisSizingMode = 'FIXED';
      rectangle.counterAxisAlignItems = 'MIN';

      rectangle.layoutAlign = 'INHERIT';
      rectangle.paddingLeft = 4;
      rectangle.paddingRight = 4;
      rectangle.paddingTop = 4;
      rectangle.paddingBottom = 4;
      rectangle.itemSpacing = 1;
      rectangle.cornerRadius = 4;
    } else {
      rectangle.paddingTop = 1;
      rectangle.paddingBottom = 2;
      rectangle.paddingLeft = 13;
      rectangle.paddingRight = 13;
      rectangle.topLeftRadius = 4;
      rectangle.bottomLeftRadius = 4;
      rectangle.topRightRadius = 0;
      rectangle.bottomRightRadius = 0;

      const keyText: TextNode = buildText(type, hexToDecimalRgb('#ffffff'), innerText);
      rectangle.appendChild(keyText);
    }
  } else if (['label', 'heading'].includes(type)) {
    rectangle.paddingLeft = 0;
    rectangle.paddingTop = 2;
    rectangle.paddingBottom = 2;
    if (!isLegendIcon) {
      rectangle.paddingRight = 2;
      rectangle.cornerRadius = 4;
    } else {
      rectangle.paddingRight = 0;
      rectangle.topLeftRadius = 4;
      rectangle.bottomLeftRadius = 4;
      rectangle.topRightRadius = 0;
      rectangle.bottomRightRadius = 0;
    }

    // ----- set up inner halves content
    const rectLeft: FrameNode = buildRectangleInnerHalf('left', hexToDecimalRgb(COLORS[type]), isLegendIcon);
    const rectRight: FrameNode = buildRectangleInnerHalf('right', hexToDecimalRgb('#ffffff'), isLegendIcon);
    const textLeft: TextNode = buildText(type, hexToDecimalRgb('#ffffff'), type.slice(0, 1).toUpperCase());
    const textRight: TextNode = buildText(type, hexToDecimalRgb('#000000'), innerText);

    rectLeft.appendChild(textLeft);
    rectRight.appendChild(textRight);
    rectangle.appendChild(rectLeft);
    rectangle.appendChild(rectRight);
  }
  return rectangle;
};

/**
 * @description Builds the initial annotation elements in Figma (diamond, rectangle, text),
 * and sets auto-layout and constraint properties.
 *
 * @kind function
 * @name buildAnnotation
 *
 * @param {Object} options Object that includes `text` – the text for the annotation,
 * `secondaryText` – optional secondary text for the annotation, and `type` – a string
 * representing the type of annotation (component or foundation).
 *
 * @returns {Object} Each annotation element as a node (`diamond`, `rectangle`, `text`,
 * and `icon`).
 *
 * @private
 */
const buildAnnotation = (options: {
  mainText: string,
  secondaryText?: string,
  type:
    'component'
    | 'custom'
    | 'dimension'
    | 'keystop'
    | 'label'
    | 'heading'
    | 'spacing'
    | 'style',
  isLegendIcon?: boolean,
}): {
  diamond: PolygonNode,
  rectangle: FrameNode,
  text: TextNode,
  icon: FrameNode,
} => {
  const {
    mainText,
    secondaryText,
    type,
    isLegendIcon,
  } = options;
  const colorHex: string = COLORS[type];
  const color: { r: number, g: number, b: number } = hexToDecimalRgb(colorHex);
  let icon: FrameNode = null;
  let diamond: PolygonNode = null;
  let text: TextNode = null;
  let innerText: string = '';

  if (['label', 'heading'].includes(type) || (type === 'keystop' && isLegendIcon)) {
    innerText = mainText;
  }

  const rectangle: FrameNode = buildRectangle(type, color, innerText, isLegendIcon);

  if (!isLegendIcon) {
    diamond = figma.createPolygon();
    diamond.name = 'Diamond';
    diamond.resize(10, 6);
    diamond.rotation = 180;
    diamond.pointCount = 3;
    diamond.fills = [{
      type: 'SOLID',
      color,
    }];

    if (mainText && !innerText) {
      const finalText: string = !secondaryText ? mainText : `${mainText}\n${secondaryText}`;
      text = buildText(type, hexToDecimalRgb('#ffffff'), finalText);
    }

    if (['spacing', 'dimension'].includes(type)) {
      icon = buildMeasureIcon(colorHex);
    } else if (type === 'keystop') {
      const iconColor: { r: number, g: number, b: number } = hexToDecimalRgb('#ffffff');
      icon = buildKeystopIcon(iconColor);
    }
  }


  return {
    diamond,
    rectangle,
    text,
    icon,
  };
};

/**
 * @description Builds the auxilary annotation in Figma for a keystop annotation.
 *
 * @kind function
 * @name buildAuxAnnotation
 *
 * @param {string} auxType The type of auxilary annotation to build: `arrows-left-right`,
 * `arrows-up-down`, `enter`, `escape`, `space`.
 *
 * @returns {Object} The full auxilary annotation FrameNode.
 *
 * @private
 */
const buildAuxAnnotation = (auxType: PluginKeystopKeys): FrameNode => {
  // set the dominant color
  const colorHex: string = COLORS.keystop;

  let setText: string = null;
  let nameText: string = 'Key';
  let buildIcons: boolean = false;
  switch (auxType) {
    case 'arrows-left-right':
    case 'arrows-up-down':
      buildIcons = true;
      nameText = '<- ->';
      break;
    case 'enter':
    case 'escape':
    case 'space': {
      setText = auxType.charAt(0).toUpperCase() + auxType.slice(1);
      nameText = setText;
      break;
    }
    default:
      setText = null;
  }

  // set up the color object
  // with each color in decimal format: `{r: 1, g: 0.4, b: 0.4}`
  const color: { r: number, g: number, b: number } = hexToDecimalRgb(colorHex);

  // build the rounded rectangle with auto-layout properties
  const rectangle: FrameNode = buildRectangle('keystop', color);

  // create text node
  let text: TextNode = null;
  if (setText) {
    text = buildText('keystop', hexToDecimalRgb('#ffffff'), setText);
    text.fontSize = 14;
  }

  // create icon
  let icon1: FrameNode = null;
  let icon2: FrameNode = null;
  if (buildIcons) {
    const iconColor: { r: number, g: number, b: number } = hexToDecimalRgb('#ffffff');
    icon1 = buildKeystopArrowIcon(iconColor);
    icon1.rotation = 180;
    icon2 = buildKeystopArrowIcon(iconColor);
  }

  // update base rectangle for aux annotation
  rectangle.layoutMode = 'HORIZONTAL';
  rectangle.primaryAxisSizingMode = 'AUTO';
  rectangle.primaryAxisAlignItems = 'SPACE_BETWEEN';
  rectangle.counterAxisSizingMode = 'AUTO';
  rectangle.counterAxisAlignItems = 'CENTER';
  rectangle.layoutAlign = 'INHERIT';
  rectangle.layoutGrow = 0;

  // initial padding
  rectangle.paddingTop = 4;
  rectangle.paddingBottom = 4;
  rectangle.paddingLeft = 4;
  rectangle.paddingRight = 4;
  rectangle.cornerRadius = 4;

  if (text) {
    rectangle.appendChild(text);
    text.layoutAlign = 'INHERIT';

    // padding adjustments
    rectangle.paddingTop = 3;
    rectangle.paddingBottom = 5;
    if (auxType === 'space') {
      rectangle.paddingRight = 24;
    } else {
      rectangle.paddingRight = 12;
    }
  }

  if (icon1 && icon2) {
    // rectangle.counterAxisSizingMode = 'AUTO';
    rectangle.appendChild(icon1);
    rectangle.appendChild(icon2);
    rectangle.itemSpacing = 10;
    icon1.layoutAlign = 'INHERIT';
    icon2.layoutAlign = 'INHERIT';

    // padding adjustments
    rectangle.paddingTop = 9;
    rectangle.paddingBottom = 9;
  }
  rectangle.y = 0;

  if (auxType === 'arrows-up-down') {
    nameText = '↑↓';
    rectangle.rotation = 90;
  }
  rectangle.name = `Key ${nameText}`;
  return rectangle;
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
  const colorOpactiy: number = 0.25; // 25% opacity

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
 * @description Builds the initial legend frame for label annotation legend items.
 *
 * @kind function
 * @name buildLabelLegend
 *
 * @returns {Object} Returns the legend frame.
 */
const buildLegend = () => {
  const legend: FrameNode = figma.createFrame();
  // auto-layout
  legend.layoutMode = 'VERTICAL';
  legend.primaryAxisSizingMode = 'AUTO';
  legend.primaryAxisAlignItems = 'SPACE_BETWEEN';
  legend.counterAxisSizingMode = 'FIXED';
  legend.counterAxisAlignItems = 'CENTER';
  legend.layoutAlign = 'STRETCH';
  legend.layoutGrow = 0;
  legend.verticalPadding = 0;
  legend.horizontalPadding = 0;

  return legend;
};

/**
 * @description Positions the legend frame respective to the design frame it corresponds with.
 *
 * @kind function
 * @name positionLegend
 *
 * @param {Object} legend The Figma frame that contains the annotation legend.
 * @param {string} originFramePosition The position of the design frame the legend pertains to.
 *
 * @returns {Object} The final legend after positioning.
 * @private
 */
const positionLegend = (
  legend: FrameNode,
  originFramePosition: {
    width: number,
    height: number,
    x: number,
    y: number,
  },
) => {
  const legendFrame = legend;

  legendFrame.layoutMode = 'VERTICAL';
  legendFrame.primaryAxisSizingMode = 'AUTO';
  legendFrame.primaryAxisAlignItems = 'MIN';
  legendFrame.counterAxisSizingMode = 'AUTO';
  legendFrame.counterAxisAlignItems = 'CENTER';
  legendFrame.layoutAlign = 'INHERIT';
  legendFrame.fills = [];
  legendFrame.clipsContent = false;

  const placementX: number = originFramePosition.x + (originFramePosition.width + 20);
  const placementY: number = originFramePosition.y;
  legendFrame.x = placementX;
  legendFrame.y = placementY;

  return legendFrame;
};

/**
 * @description Gets the text to display for legend entries.
 *
 * @kind function
 * @name getLegendLabelText
 *
 * @param {Object} labels The entry's label data.
 * @param {Object} labelName The name of the particular label we need text for.
 *
 * @returns {Array} Returns the formatted field data to be used in the legend entry.
 */
const getLegendLabelText = (labels, labelName) => {
  const { visible, alt, a11y } = labels || {};
  if (labelName === 'alt') {
    return alt ? `"${alt}"` : 'undefined';
  }
  if (a11y) {
    return `"${a11y}"`;
  }
  return visible ? 'n/a' : 'undefined';
};

/**
 * @description Builds the initial legend frame for label annotation legend items.
 *
 * @kind function
 * @name getLegendEntryFields
 *
 * @param {string} type The type of the legend entry we're building.
 * @param {Object} data The node's data to format and include in the legend entry.
 *
 * @returns {Array} Returns the formatted field data to be used in the legend entry.
 */
const getLegendEntryFields = (type, data) => {
  const {
    role,
    labels,
    heading,
    keys,
  } = data;
  let fields;

  if (type === 'label') {
    if (role === 'image-decorative') {
      fields = [
        {
          name: 'Role',
          val: 'Image (decorative)',
        },
      ];
    } else if (role === 'image') {
      fields = [
        {
          name: 'Role',
          val: 'Image',
        },
        {
          name: 'Alt text',
          val: getLegendLabelText(labels, 'alt'),
        },
      ];
    } else if (role && role !== 'no-role') {
      fields = [
        {
          name: 'Role',
          val: ROLE_OPTS.find(opt => opt.value === role).text,
        },
        {
          name: 'Visible label',
          val: labels?.visible ? 'Yes' : 'No',
        },
        {
          name: 'A11y label',
          val: getLegendLabelText(labels, 'a11y'),
        },
      ];
    } else if (!role || role === 'no-role') {
      fields = [
        {
          name: 'Visible label',
          val: labels?.visible ? 'Yes' : 'No',
        }, {
          name: 'A11y label',
          val: getLegendLabelText(labels, 'a11y'),
        },
      ];
    }
  } else if (type === 'heading') {
    fields = [
      {
        name: 'Heading level',
        val: (heading?.level !== 'no-level' && heading?.level) || 'n/a',
      }, {
        name: 'Visible',
        val: !heading || heading?.visible ? 'Yes' : 'No',
      },
    ];
    if (heading && !heading.visible) {
      fields.push({
        name: 'Heading',
        val: heading.invisible ? `"${heading.invisible}"` : 'undefined',
      });
    }
  } else {
    let keyList = '';
    keys?.forEach((key, i) => {
      const keyText = KEY_OPTS.find(opt => opt.value === key).text;
      const listItem = i === keys.length - 1 ? keyText : `${keyText}, `;
      keyList += listItem;
    });
    fields = [
      {
        name: 'Keys',
        val: keyList || 'n/a',
      },
    ];
  }
  return fields;
};

/**
 * @description Builds the nodes that will be appended to a legend entry.
 *
 * @kind function
 * @name buildLegendFieldNodes
 *
 * @param {string} type The type of the legend entry we're building.
 * @param {Object} nodeData The node's data to format and include in the legend entry.
 *
 * @returns {Array} Returns the legend entry nodes to append.
 */
const buildLegendFieldNodes = (type, nodeData) => {
  const nodes = [];
  const fields = getLegendEntryFields(type, nodeData);

  fields.forEach(({ name, val }, index) => {
    const line: FrameNode = figma.createFrame();
    line.name = `${name} field`;
    line.layoutMode = 'HORIZONTAL';
    line.primaryAxisSizingMode = 'FIXED';
    line.primaryAxisAlignItems = 'MIN';
    line.counterAxisSizingMode = 'AUTO';
    line.counterAxisAlignItems = 'MIN';
    line.layoutAlign = 'STRETCH';
    line.paddingLeft = 10;
    line.paddingRight = 10;
    line.paddingTop = 2;
    line.paddingBottom = 2;
    line.itemSpacing = 5;

    const fieldTitle: TextNode = buildText('legend', hexToDecimalRgb('#000000'), `${name}:`);
    const fieldValue: TextNode = buildText('legend', hexToDecimalRgb('#000000'), val, val === 'undefined');

    if (index === 0) {
      line.topRightRadius = 5;
    }
    if (index === fields.length - 1) {
      line.bottomLeftRadius = 5;
      line.bottomRightRadius = 5;
    }

    line.appendChild(fieldTitle);
    line.appendChild(fieldValue);
    nodes.push(line);
  });

  return nodes;
};

/**
 * @description Positions the legend frame respective to the design frame it corresponds with.
 *
 * @kind function
 * @name buildLegendEntry
 *
 * @param {string} type The type of annotation the legend entry represents.
 * @param {Object} nodeData The note data to be rendered in the legend.
 *
 * @returns {Object} The final legend after positioning.
 */
const buildLegendEntry = (type: PluginStopType, nodeData: any) => {
  const legendItem: FrameNode = figma.createFrame();
  const { annotationText } = nodeData;
  legendItem.name = `${type.slice(0, 1).toUpperCase()}${annotationText} Annotation`;

  const iconElements = buildAnnotation({
    mainText: annotationText,
    secondaryText: null,
    type,
    isLegendIcon: true,
  });
  const icon: FrameNode = figma.createFrame();

  icon.layoutMode = 'VERTICAL';
  icon.primaryAxisSizingMode = 'AUTO';
  icon.primaryAxisAlignItems = 'CENTER';
  icon.counterAxisSizingMode = 'AUTO';
  icon.counterAxisAlignItems = 'CENTER';
  icon.layoutAlign = 'INHERIT';

  icon.name = 'Tag';
  icon.appendChild(iconElements.rectangle);

  legendItem.layoutMode = 'HORIZONTAL';
  legendItem.primaryAxisSizingMode = 'FIXED';
  legendItem.primaryAxisAlignItems = 'MIN';
  legendItem.counterAxisSizingMode = 'AUTO';
  legendItem.counterAxisAlignItems = 'MIN';
  legendItem.layoutAlign = 'STRETCH';
  legendItem.layoutGrow = 0;
  legendItem.paddingLeft = 15;
  legendItem.paddingRight = 15;
  legendItem.paddingTop = 15;
  legendItem.paddingBottom = 15;
  legendItem.itemSpacing = 0;

  const legendData: FrameNode = figma.createFrame();
  legendData.name = 'Data';
  legendData.layoutMode = 'VERTICAL';
  legendData.primaryAxisSizingMode = 'AUTO';
  legendData.primaryAxisAlignItems = 'MIN';
  legendData.counterAxisSizingMode = 'AUTO';
  legendData.counterAxisAlignItems = 'MIN';
  legendData.layoutAlign = 'STRETCH';
  legendData.paddingLeft = 2;
  legendData.paddingRight = 2;
  legendData.paddingTop = 2;
  legendData.paddingBottom = 2;
  legendData.itemSpacing = 0;
  legendData.topRightRadius = 6;
  legendData.bottomRightRadius = 6;
  legendData.bottomLeftRadius = 6;
  legendData.resize(300, legendData.height);
  legendData.fills = [{
    type: 'SOLID',
    color: hexToDecimalRgb(COLORS[type]),
  }];

  const fieldNodes = buildLegendFieldNodes(type, nodeData);
  fieldNodes.forEach(field => legendData.appendChild(field));

  legendItem.appendChild(icon);
  legendItem.appendChild(legendData);
  legendItem.locked = true;

  return legendItem;
};

/**
 * @description Sets up the individual elements for a container group (inner or outer) and
 * adds the child node to the group.
 *
 * @kind function
 * @name drawContainerGroup
 *
 * @param {Object} groupSettings Object containing the `name`, `position`,
 * `child` and `parent` nodes, and `locked` status.
 *
 * @returns {Object} The container group node object.
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
}): GroupNode => {
  const {
    name,
    position,
    parent,
    child,
    locked,
  } = groupSettings;

  // set new group
  const containerGroup: GroupNode = figma.group([child], parent);

  // position, name, and lock new group
  containerGroup.x = position.x;
  containerGroup.y = position.y;
  containerGroup.name = name;
  containerGroup.locked = locked;

  return containerGroup;
};

/**
 * @description Takes the individual annotation elements, the specs for the node(s) receiving
 * the annotation, and adds the annotation to the container group in the proper position,
 * orientation, and with the correct auto-layout settings and constraints.
 *
 * @kind function
 * @name positionAnnotation
 *
 * @param {Object} frame The Figma `frame` that contains the annotation.
 * @param {string} groupName The name of the group that holds the annotation elements
 * inside the `containerGroup`.
 * @param {Object} annotation Each annotation element (`diamond`, `rectangle`, `text`, and `icon`).
 * @param {Object} nodePosition The position specifications (`width`, `height`, `x`, `y`)
 * for the node receiving the annotation + the frame width/height (`frameWidth` /
 * `frameHeight`).
 * @param {string} annotationType An optional string representing the type of annotation.
 * @param {string} orientation An optional string representing the orientation of the
 * annotation (`top` or `left`).
 *
 * @returns {Object} The final annotation as a node group.
 * @private
 */
const positionAnnotation = (
  frame: FrameNode,
  groupName: string,
  annotation: {
    diamond: PolygonNode,
    rectangle: FrameNode,
    text?: TextNode,
    icon: FrameNode
  },
  nodePosition: {
    frameWidth: number,
    frameHeight: number,
    width: number,
    height: number,
    x: number,
    y: number,
  },
  annotationType:
    'component'
    | 'custom'
    | 'dimension'
    | 'keystop'
    | 'label'
    | 'heading'
    | 'spacing'
    | 'style' = 'component',
  orientation: 'top' | 'bottom' | 'right' | 'left' = 'top',
) => {
  const {
    diamond,
    rectangle,
    text,
    icon,
  } = annotation;

  const { frameWidth, frameHeight } = nodePosition;
  const nodeWidth: number = nodePosition.width;
  const nodeHeight: number = nodePosition.height;
  const nodeX: number = nodePosition.x;
  const nodeY: number = nodePosition.y;

  let isMeasurement: boolean = false;
  if (
    annotationType === 'spacing'
    || annotationType === 'dimension'
  ) {
    isMeasurement = true;
  }

  // add text to box frame
  if (rectangle && text) {
    rectangle.appendChild(text);
  }

  // create the annotation frame
  let group: FrameNode = null;
  let diamondVector: VectorNode = null;
  let iconNew: FrameNode = null;

  const bannerGroup: FrameNode = figma.createFrame();
  bannerGroup.name = isMeasurement ? 'Banner' : groupName;

  // auto-layout
  bannerGroup.layoutMode = 'VERTICAL';
  bannerGroup.primaryAxisSizingMode = 'AUTO';
  bannerGroup.primaryAxisAlignItems = 'CENTER';
  bannerGroup.counterAxisSizingMode = 'AUTO';
  bannerGroup.counterAxisAlignItems = 'CENTER';
  bannerGroup.layoutAlign = 'INHERIT';

  // padding / fills
  bannerGroup.fills = [];

  if (rectangle) {
    bannerGroup.appendChild(rectangle);
  }

  if (diamond) {
    // flatten it and convert to vector
    diamondVector = figma.flatten([diamond]);
    diamondVector.layoutGrow = 0;
    diamondVector.layoutAlign = 'INHERIT';

    bannerGroup.appendChild(diamondVector);
  }

  // set up annotation with icon
  if (icon) {
    if (isMeasurement) {
      const groupWithIcon: FrameNode = figma.createFrame();
      groupWithIcon.name = groupName;

      // auto-layout
      groupWithIcon.layoutMode = 'VERTICAL';
      groupWithIcon.primaryAxisSizingMode = 'AUTO';
      groupWithIcon.counterAxisAlignItems = 'CENTER';
      groupWithIcon.counterAxisSizingMode = 'AUTO';
      groupWithIcon.primaryAxisAlignItems = 'CENTER';
      groupWithIcon.layoutAlign = 'INHERIT';

      // padding / fills
      groupWithIcon.itemSpacing = 3;
      groupWithIcon.fills = [];

      // append children
      groupWithIcon.appendChild(bannerGroup);
      groupWithIcon.appendChild(icon);

      // set top level
      group = groupWithIcon;
    } else if (annotationType === 'keystop') {
      // ----- add icon to the rectangle frame
      rectangle.appendChild(icon);

      // ----- set up text wrapper with padding to provide minimum width
      const textWrapper: FrameNode = figma.createFrame();
      textWrapper.name = 'Text Wrapper';
      textWrapper.fills = [];

      // auto-layout / padding
      textWrapper.layoutMode = 'HORIZONTAL';
      textWrapper.primaryAxisSizingMode = 'AUTO';
      textWrapper.counterAxisAlignItems = 'CENTER';
      textWrapper.counterAxisSizingMode = 'AUTO';
      textWrapper.primaryAxisAlignItems = 'CENTER';
      textWrapper.layoutAlign = 'INHERIT';
      textWrapper.paddingRight = 30;

      // add text to wrapper
      textWrapper.appendChild(text);

      // ----- add text wrapper last to force it to the bottom
      rectangle.appendChild(textWrapper);

      // ----- set constraints / defaults
      icon.resize(30, icon.height);
      icon.layoutAlign = 'STRETCH';
      rectangle.layoutAlign = 'STRETCH';

      // ----- set the main group
      group = bannerGroup;
    }
  } else {
    // set the main group
    group = bannerGroup;
  }

  // set outer constraints
  group.constraints = {
    horizontal: 'CENTER',
    vertical: 'MAX',
  };

  // set outer clipping
  group.clipsContent = false;

  // ------- position the group within the frame, above the node receiving the annotation
  let frameEdgeY: string = null;
  let frameEdgeX: string = null;

  // initial placement based on node to annotate
  // for top (centered horizontally)
  let placementX: number = (
    nodeX + (
      (nodeWidth - rectangle.width) / 2
    )
  );

  // for `left` or `right`
  let placementY: number = (
    nodeY + (
      (nodeHeight - rectangle.height) / 2
    )
  );

  let offsetX: number = null;
  let offsetY: number = null;

  // adjustments based on orientation
  switch (orientation) {
    case 'left':
      offsetX = (isMeasurement ? 36 : 38);
      placementX = nodeX - offsetX;
      break;
    case 'right':
      offsetX = (isMeasurement ? 12 : 5);
      placementX = nodeX + nodeWidth + offsetX;
      break;
    default: // top
      offsetY = (isMeasurement ? 15 : 8);
      placementY = nodeY - rectangle.height - offsetY;
  }

  if (['keystop', 'label', 'heading'].includes(annotationType)) {
    if ((nodeWidth - 100) > rectangle.width) {
      placementX = nodeX + 10;
    }
  }

  // detect left edge
  if ((placementX - 5) < 0) {
    frameEdgeX = 'left';
  }

  // detect right edge
  if (((placementX + 5) + group.width) > frameWidth) {
    frameEdgeX = 'right';
  }

  // detect top edge
  if ((placementY - 5) < 0) {
    frameEdgeY = 'top';
  }

  // detect bottom edge
  if ((placementY + 5) > (frameHeight - group.height)) {
    frameEdgeY = 'bottom';
  }

  // set annotation group placement, relative to container group
  group.x = placementX;
  group.y = placementY;

  // move diamond to left/right edge, if necessary
  if (orientation === 'left' || orientation === 'right') {
    bannerGroup.layoutMode = 'HORIZONTAL';

    if (orientation === 'right') {
      bannerGroup.appendChild(rectangle);
      diamondVector.rotation = 270;

      // update outer constraints
      group.constraints = {
        horizontal: 'MIN',
        vertical: 'CENTER',
      };
    } else {
      bannerGroup.appendChild(diamondVector);
      diamondVector.rotation = 90;

      // update outer constraints
      group.constraints = {
        horizontal: 'MAX',
        vertical: 'CENTER',
      };
    }
  }

  // adjust the measure icon width for top-oriented annotations
  if (isMeasurement && icon && (orientation === 'top')) {
    group.resize(nodeWidth, group.height);
    group.x = nodeX;

    if (annotationType === 'dimension') {
      group.y = nodeY - group.height - 4;
    } else {
      group.y = nodeY - group.height + 2;
    }
  }

  // adjust the measure icon height for left-/right-oriented annotations
  if (orientation !== 'top') {
    // remove horizontal icon (easier to re-draw)
    icon.remove();

    // re-orient main group
    group.layoutMode = 'HORIZONTAL';

    // redraw icon in vertical orientation
    const measureIconColor: string = (annotationType === 'spacing' ? COLORS.spacing : COLORS.dimension);
    iconNew = buildMeasureIcon(measureIconColor, 'vertical');

    // add back into group
    group.appendChild(iconNew);

    if (orientation === 'right') {
      group.appendChild(bannerGroup);
    }

    // resize icon based on gap/node height
    group.resize(group.width, nodeHeight);

    // position annotation on `y`
    group.y = nodeY;

    // position on `x` based on orientation
    if (orientation === 'right') {
      group.x = nodeX + nodeWidth + 4;
    } else {
      group.x = nodeX - group.width + 2;
    }
  }

  // adjust placement, if necessary
  if (frameEdgeX || frameEdgeY) {
    if (!isMeasurement) {
      // move to right of node, right orientation
      if (frameEdgeX === 'left') {
        group.layoutMode = 'HORIZONTAL';
        group.appendChild(rectangle);
        diamondVector.layoutAlign = 'INHERIT';
        diamondVector.rotation = 270;

        // update outer constraints
        group.constraints = {
          horizontal: 'MIN',
          vertical: 'CENTER',
        };

        // update position
        group.x = nodeWidth - (0 - nodeX) + 5;
        group.y = nodeY + ((nodeHeight - group.height) / 2);
      }

      // move to left of node, left orientation
      if (frameEdgeX === 'right') {
        group.layoutMode = 'HORIZONTAL';
        diamondVector.layoutAlign = 'INHERIT';
        diamondVector.rotation = 90;

        // update outer constraints
        group.constraints = {
          horizontal: 'MAX',
          vertical: 'CENTER',
        };

        // update position
        group.x = nodeX - group.width - 5;
        group.y = nodeY + ((nodeHeight - group.height) / 2);
      }

      // bottom-align annotation
      if (!frameEdgeX && frameEdgeY === 'top') {
        bannerGroup.appendChild(rectangle);
        diamondVector.rotation = 180;
        group.y = nodeY + nodeHeight + 4;

        // update outer constraints
        group.constraints = {
          horizontal: 'CENTER',
          vertical: 'MIN',
        };
      }

      // adjustments for top/bottom edges
      // top adjust
      if (group.y < 5) {
        group.y = 5;
      }

      // bottom adjust
      if (group.y > (frameHeight - group.height - 5)) {
        group.y = frameHeight - group.height - 5;
      }
    } else {
      // move top-oriented measurement dimensions to the bottom
      if (frameEdgeY === 'top' && orientation === 'top') {
        group.appendChild(bannerGroup);
        bannerGroup.appendChild(rectangle);
        diamondVector.rotation = 180;

        // update outer constraints
        group.constraints = {
          horizontal: 'CENTER',
          vertical: 'MIN',
        };

        // adjust position against midpoint
        if (nodeY > 0) {
          group.y = nodeY - 2;
        } else {
          group.y = 4;
        }

        // if dimension, move to bottom
        if (annotationType === 'dimension') {
          group.y = nodeY + nodeHeight + 4;
        }
      }

      // adjust position against midpoint
      if (frameEdgeY === 'bottom' && orientation === 'top') {
        group.y = frame.height - group.height - 4;
      }

      // move right-side annotation to the left side
      if (
        (frameEdgeX === 'right' && orientation === 'right')
        || (frameEdgeY === 'bottom' && orientation === 'right')
      ) {
        group.appendChild(iconNew);
        bannerGroup.appendChild(diamondVector);
        diamondVector.rotation = 90;
        group.x = (nodeX - group.width - 4);

        // update outer constraints
        group.constraints = {
          horizontal: 'MAX',
          vertical: 'CENTER',
        };
      }

      // move left-side annotation to the right side
      if (frameEdgeX === 'left' && orientation === 'left') {
        group.appendChild(bannerGroup);
        bannerGroup.appendChild(rectangle);
        diamondVector.rotation = 270;

        // update outer constraints
        group.constraints = {
          horizontal: 'MIN',
          vertical: 'CENTER',
        };

        // adjust position against midpoint
        if (nodeX < 0) {
          group.x = 4;
        } else {
          group.x = nodeX - 4;
        }
      }

      // adjust position against edge of frame
      if (frameEdgeX === 'right' && orientation === 'left') {
        if (nodeX > frameWidth) {
          group.x = frameWidth - group.width - 4;
        }
      }
    }
  }

  return group;
};

/**
 * @description Redraws the legend when the annotation order has been rearranged.
 *
 * @kind function
 * @name refreshLegend
 *
 * @param {string} type The type of stops the legend is for.
 * @param {string} frameId The id of the design frame the legend corresponds to.
 * @param {Array} trackingData The up-to-date annotation tracking data.
 * @param {Array} stopList The up-to-date reordered list of stops.
 *
 * @returns {undefined}
 *
 */
const refreshLegend = (
  type: PluginStopType,
  frameId: string,
  trackingData: Array<PluginNodeTrackingData>,
  stopList: Array<PluginStopListData>,
) => {
  const legend = getLegendFrame(frameId, figma.currentPage);
  const updatedTracking = [...trackingData];
  if (legend) {
    legend.children.forEach(child => child.remove());
  }

  stopList.forEach((item) => {
    const node = figma.getNodeById(item.id);
    const trackingIndex = trackingData.findIndex(({ id }) => id === item.id);
    if (node) {
      const nodeData = JSON.parse(node.getPluginData(DATA_KEYS[`${type}NodeData`]));
      const legendItem = buildLegendEntry(type, nodeData);

      updatedTracking[trackingIndex].legendItemId = legendItem.id;
      legendItem.setPluginData(DATA_KEYS[`${type}LinkId`], JSON.stringify({
        role: 'legendItem',
        id: trackingData[trackingIndex].linkId,
      }));
      legend.appendChild(legendItem);
    }
  });
  figma.currentPage.setPluginData(DATA_KEYS[`${type}Annotations`], JSON.stringify(updatedTracking));
};

/**
 * @description Edits the number in the stop annotation when the order has changed.
 *
 * @kind function
 * @name updateAnnotationNum
 *
 * @param {string} nodeId The id of the design node the annotation corresponds to.
 * @param {string} number The order number to show in the annotation.
 * @param {Array} trackingData The up-to-date annotation tracking data.
 *
 * @returns {undefined}
 *
 */
const updateAnnotationNum = (
  nodeId: string,
  number: string,
  trackingData: Array<PluginNodeTrackingData>,
) => {
  const annotationNodeId = trackingData.find(entry => entry.id === nodeId)?.annotationId;

  if (figma.getNodeById(nodeId) && annotationNodeId) {
    const annotationNode = figma.getNodeById(annotationNodeId) as FrameNode;

    if (annotationNode) {
      const textNode = annotationNode.findOne(layer => layer.type === 'TEXT'
      && parseInt(layer.characters, 10) > 0) as TextNode;

      textNode.characters = number;
    }
  }
};

/**
 * @description Edits the values of the legend entry when updated in the UI.
 *
 * @kind function
 * @name updateLegendEntry
 *
 * @param {string} type The stop type the annotations correspond to.
 * @param {string} nodeId The id of the design node the annotation corresponds to.
 * @param {Object} nodeData The field data to display in the legend entry.
 *
 * @returns {undefined}
 *
 */
const updateLegendEntry = (
  type: PluginStopType,
  nodeId: string,
  nodeData: Object,
) => {
  const trackingData = JSON.parse(figma.currentPage.getPluginData(DATA_KEYS[`${type}Annotations`]));
  const { legendItemId } = trackingData?.find(entry => entry.id === nodeId);

  if (figma.getNodeById(nodeId) && legendItemId) {
    const legendItem = figma.getNodeById(legendItemId) as FrameNode;

    if (legendItem) {
      const dataFrame = legendItem.findChild(child => child.name === 'Data') as FrameNode;
      dataFrame.children.forEach(child => child.remove());

      const fieldNodes = buildLegendFieldNodes(type, nodeData);
      fieldNodes.forEach(node => dataFrame.appendChild(node));
    }
  }
};

export {
  buildAnnotation,
  buildAuxAnnotation,
  buildBoundingBox,
  buildKeystopArrowIcon,
  buildKeystopIcon,
  buildLegend,
  buildLegendEntry,
  buildMeasureIcon,
  buildRectangle,
  buildRectangleInnerHalf,
  buildText,
  drawContainerGroup,
  positionAnnotation,
  positionLegend,
  refreshLegend,
  updateAnnotationNum,
  updateLegendEntry,
};
