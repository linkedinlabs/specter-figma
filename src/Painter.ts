import Crawler from './Crawler';
import {
  findTopFrame,
  getNodeSettings,
  hexToDecimalRgb,
  isInternal,
  updateArray,
  updateNestedArray,
} from './Tools';
import {
  COLORS,
  DATA_KEYS,
  PLUGIN_IDENTIFIER,
  PLUGIN_NAME,
  SPACING_MATRIX,
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

/** WIP
 * @description Builds the initial annotation elements in Figma (diamond, rectangle, text),
 * and sets auto-layout and constraint properties.
 *
 * @kind function
 * @name buildKeystopIcon
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

  const shape = figma.flatten([diamond, rectangle2], icon);
  shape.name = 'Step Forward Icon';
  shape.x = 26;

  icon.appendChild(rectangle1);
  rectangle1.y = 3;

  // style the icon frame
  icon.name = 'Tab Stop Icon';
  icon.fills = [];
  icon.layoutAlign = 'STRETCH';
  icon.resize(33, 8);

  // set constraints after resize
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

/** WIP
 * @description Builds the initial annotation elements in Figma (diamond, rectangle, text),
 * and sets auto-layout and constraint properties.
 *
 * @kind function
 * @name buildRectangle
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
const buildRectangle = (
  type:
    'component'
    | 'custom'
    | 'dimension'
    | 'keystop'
    | 'keystopkey'
    | 'spacing'
    | 'style',
  color: { r: number, g: number, b: number },
): FrameNode => {
  // build base rectangle (used for most annotations)
  const rectangle: FrameNode = figma.createFrame();
  rectangle.name = 'Box / Text';
  rectangle.layoutMode = 'HORIZONTAL';
  rectangle.counterAxisSizingMode = 'AUTO';
  rectangle.layoutAlign = 'CENTER';
  rectangle.horizontalPadding = 16;
  rectangle.verticalPadding = 4.5;
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
    rectangle.horizontalPadding = 3;
    rectangle.verticalPadding = 0.5;
  }

  // ------- update rectangle for keystop annotations
  if (type === 'keystop') {
    rectangle.layoutMode = 'VERTICAL';
    rectangle.counterAxisSizingMode = 'FIXED';
    rectangle.layoutAlign = 'MIN';
    rectangle.horizontalPadding = 4;
    rectangle.verticalPadding = 4;
    rectangle.itemSpacing = 1;
    rectangle.cornerRadius = 4;
    rectangle.resize(42, 35);
  }

  return rectangle;
};

/** WIP
 * @description Builds the initial annotation elements in Figma (diamond, rectangle, text),
 * and sets auto-layout and constraint properties.
 *
 * @kind function
 * @name buildText
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
const buildText = (
  type:
    'component'
    | 'custom'
    | 'dimension'
    | 'keystop'
    | 'keystopkey'
    | 'spacing'
    | 'style',
  color: { r: number, g: number, b: number },
  characters: string,
): TextNode => {
  // create empty text node
  const text: TextNode = figma.createText();

  // detect/retrieve last-loaded typeface
  const typefaceToUse: FontName = JSON.parse(figma.currentPage.getPluginData('typefaceToUse'));

  // style text node
  text.fontName = typefaceToUse;
  text.fontSize = 12;
  text.lineHeight = { value: 125, unit: 'PERCENT' };
  text.fills = [{
    type: 'SOLID',
    color: hexToDecimalRgb('#ffffff'),
  }];
  text.layoutAlign = 'CENTER';

  // set text – cannot do this before defining `fontName`
  text.characters = characters;

  // position the text in auto-layout
  text.textAlignVertical = 'CENTER';
  text.textAlignHorizontal = 'CENTER';
  text.textAutoResize = 'WIDTH_AND_HEIGHT';

  // ------- update text for keystop annotations
  if (type === 'keystop') {
    text.fontSize = 14;
    text.textAlignHorizontal = 'LEFT';
    text.textAutoResize = 'WIDTH_AND_HEIGHT';
    text.layoutAlign = 'MIN';
  }

  return text;
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
    | 'spacing'
    | 'style',
}): {
  diamond: PolygonNode,
  rectangle: FrameNode,
  text: TextNode,
  icon: FrameNode,
} => {
  const { mainText, secondaryText, type } = options;

  // set the dominant color
  const colorHex: string = COLORS[type];

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

  // set up the color object
  // with each color in decimal format: `{r: 1, g: 0.4, b: 0.4}`
  const color: { r: number, g: number, b: number } = hexToDecimalRgb(colorHex);

  // build the rounded rectangle with auto-layout properties
  const rectangle: FrameNode = buildRectangle(type, color);

  // build the dangling diamond
  const diamond: PolygonNode = figma.createPolygon();
  diamond.name = 'Diamond';

  // position and size the diamond
  diamond.resize(10, 6);
  diamond.rotation = 180;
  diamond.pointCount = 3;

  // style it – set the diamond type, color, and opacity
  diamond.fills = [{
    type: 'SOLID',
    color,
  }];

  // create text node
  const text: TextNode = buildText(type, color, setText);

  // create icon
  let icon: FrameNode = null;
  if (isMeasurement) {
    icon = buildMeasureIcon(colorHex);
  } else if (type === 'keystop') {
    const iconColor: { r: number, g: number, b: number } = hexToDecimalRgb('#ffffff');
    icon = buildKeystopIcon(iconColor);
  }

  // return an object with each element
  return {
    diamond,
    rectangle,
    text,
    icon,
  };
};

/** WIP
 * @description Builds the initial annotation elements in Figma (diamond, rectangle, text),
 * and sets auto-layout and constraint properties.
 *
 * @kind function
 * @name buildAuxAnnotation
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
const buildAuxAnnotation = (options: {
  mainText: string,
  type: 'keystopkey',
}): FrameNode => {
  const { mainText, type } = options;

  // set the dominant color
  const colorHex: string = COLORS[type];

  const setText: string = mainText;

  // set up the color object
  // with each color in decimal format: `{r: 1, g: 0.4, b: 0.4}`
  const color: { r: number, g: number, b: number } = hexToDecimalRgb(colorHex);

  // build the rounded rectangle with auto-layout properties
  const rectangle: FrameNode = buildRectangle(type, color);

  // create text node
  const text: TextNode = buildText(type, color, setText);
  text.fontSize = 14;
  // text.verticalPadding

  // create icon
  const icon: FrameNode = null;

  // update base rectangle for aux annotation
  rectangle.counterAxisSizingMode = 'FIXED';
  rectangle.layoutAlign = 'MIN';
  rectangle.appendChild(text);
  rectangle.appendChild(icon);
  rectangle.resize(text.width, text.height + 8);
  rectangle.y = 0;
  rectangle.horizontalPadding = 4;
  rectangle.verticalPadding = 4;
  rectangle.cornerRadius = 4;
  rectangle.name = 'Key';
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
 * @param {Object} nodePosition The position specifications (`width`, `height`, `x`, `y`, `index`)
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
    text: TextNode,
    icon: FrameNode,
  },
  nodePosition: {
    frameWidth: number,
    frameHeight: number,
    width: number,
    height: number,
    x: number,
    y: number,
    index: number,
  },
  annotationType:
    'component'
    | 'custom'
    | 'dimension'
    | 'keystop'
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
  bannerGroup.layoutMode = 'VERTICAL';
  bannerGroup.counterAxisSizingMode = 'AUTO';
  bannerGroup.layoutAlign = 'CENTER';
  bannerGroup.fills = [];

  if (rectangle) { bannerGroup.appendChild(rectangle); }
  if (diamond) {
    // flatten it and convert to vector
    diamondVector = figma.flatten([diamond]);
    diamondVector.layoutAlign = 'CENTER';

    bannerGroup.appendChild(diamondVector);
  }

  // set up annotation with icon
  if (icon) {
    if (isMeasurement) {
      const groupWithIcon: FrameNode = figma.createFrame();
      groupWithIcon.name = groupName;
      groupWithIcon.fills = [];
      groupWithIcon.layoutMode = 'VERTICAL';
      groupWithIcon.counterAxisSizingMode = 'AUTO';
      groupWithIcon.layoutAlign = 'CENTER';
      groupWithIcon.itemSpacing = 3;

      // append children
      groupWithIcon.appendChild(bannerGroup);
      groupWithIcon.appendChild(icon);

      // set top level
      group = groupWithIcon;
    } else if (annotationType === 'keystop') {
      // add icon to the rectangle frame
      rectangle.appendChild(icon);
      // re-add text to force it to the bottom
      rectangle.appendChild(text);

      // set constraints
      bannerGroup.counterAxisSizingMode = 'FIXED';
      rectangle.layoutAlign = 'STRETCH';

      // set the main group
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
  // for top
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
        diamondVector.layoutAlign = 'CENTER';
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
        diamondVector.layoutAlign = 'CENTER';
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
  const locked: boolean = groupType === 'topLevel';

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
      const ccgResult = createContainerGroup(updatedContainerSet, type, frame, node);
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

    const nodeSettings = getNodeSettings(this.page, this.node.id);

    if (!nodeSettings || (nodeSettings && !nodeSettings.annotationText)) {
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
    const nodeIndex: number = this.node.parent.children.findIndex(node => node === this.node);
    const nodePosition: {
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
      width: relativePosition.width,
      height: relativePosition.height,
      x: relativePosition.x,
      y: relativePosition.y,
      index: nodeIndex,
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
    const nodeIndex: number = this.node.parent.children.findIndex(node => node === this.node);
    const nodePosition: {
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
      width: relativePosition.width,
      height: relativePosition.height,
      x: relativePosition.x,
      y: relativePosition.y,
      index: nodeIndex,
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

  /** WIP
   * @description Locates annotation text in a node’s Settings object and
   * builds the visual annotation on the Figma frame.
   *
   * @kind function
   * @name addKeystop
   *
   * @returns {Object} A result object container success/error status and log/toast messages.
   */
  addKeystop() {
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

    result.messages.log = `Draw the keyboard stop annotation for “${this.node.name}”`;

    // retrieve the node data with our annotation text
    const nodeData = JSON.parse(this.node.getPluginData(DATA_KEYS.keystopNodeData) || null);

    if (!nodeData || (nodeData && !nodeData.annotationText)) {
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
    } = nodeData;
    const annotationType: 'keystop' = 'keystop';
    const annotationName = `Keystop for ${this.node.name}`;

    // construct the base annotation elements
    const annotationBundle = buildAnnotation({
      mainText: annotationText,
      secondaryText: annotationSecondaryText,
      type: annotationType,
    });

    let auxAnnotation: FrameNode = null;
    if (nodeData.keys && nodeData.keys.length > 0) {
      auxAnnotation = buildAuxAnnotation({
        mainText: 'Enter',
        type: 'keystopkey',
      });
    }

    // grab the position from crawler
    const crawler = new Crawler({ for: [this.node] });
    const positionResult = crawler.position();
    const relativePosition = positionResult.payload;

    // group and position the base annotation elements
    const nodeIndex: number = this.node.parent.children.findIndex(node => node === this.node);
    const nodePosition: PluginNodePosition = {
      frameWidth: this.frame.width,
      frameHeight: this.frame.height,
      width: relativePosition.width,
      height: relativePosition.height,
      x: relativePosition.x,
      y: relativePosition.y,
      index: nodeIndex,
    };

    const baseAnnotationNode = positionAnnotation(
      this.frame,
      annotationName,
      annotationBundle,
      nodePosition,
      'keystop',
    );

    const initialX = baseAnnotationNode.x;
    const initialY = baseAnnotationNode.y;

    let annotationNode: FrameNode = baseAnnotationNode;
    if (auxAnnotation) {
      annotationNode = figma.createFrame();
      annotationNode.clipsContent = false;
      annotationNode.layoutMode = 'HORIZONTAL';
      annotationNode.counterAxisSizingMode = 'AUTO';
      annotationNode.layoutAlign = 'MIN';
      annotationNode.itemSpacing = 4;
      annotationNode.fills = [];
      annotationNode.name = `${baseAnnotationNode.name} (with Keys)`;
      annotationNode.appendChild(baseAnnotationNode);
      annotationNode.appendChild(auxAnnotation);
      baseAnnotationNode.layoutAlign = 'MIN';
      auxAnnotation.layoutAlign = 'MIN';
      annotationNode.resize(baseAnnotationNode.width, baseAnnotationNode.height);
      annotationNode.x = initialX;
      annotationNode.y = initialY;
    }

    // set it in the correct containers
    setNodeInContainers({
      node: annotationNode,
      frame: this.frame,
      page: this.page,
      type: 'keystop',
    });

    // ---------- set node tracking data
    const newAnnotatedNodeData = {
      annotationId: annotationNode.id,
      id: this.node.id,
      topFrameId: this.frame.id,
      nodePosition,
    };

    // update the `trackingSettings` array
    const trackingDataRaw = JSON.parse(
      this.page.getPluginData(DATA_KEYS.keystopAnnotations) || null,
    );
    let trackingData: Array<{
      annotationId: string,
      id: string,
      topFrameId: string,
      nodePosition: PluginNodePosition,
    }> = [];
    if (trackingDataRaw) {
      trackingData = trackingDataRaw;
    }

    trackingData = updateArray(
      trackingData,
      newAnnotatedNodeData,
      'id',
      'update',
    );

    // commit the `trackingData` update
    this.page.setPluginData(
      DATA_KEYS.keystopAnnotations,
      JSON.stringify(trackingData),
    );

    // return a successful result
    result.status = 'success';
    return result;
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
    const nodeIndex: number = this.node.parent.children.findIndex(node => node === this.node);
    const nodePosition: {
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
      index: nodeIndex,
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
