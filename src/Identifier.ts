import {
  existsInArray,
  getNodeSettings,
  getPeerPluginData,
  isInternal,
  isVisible,
  resizeGUI,
  setNodeSettings,
  toSentenceCase,
  findTopFrame,
  updateArray,
} from './utils/tools';
import {
  CONTAINER_NODE_TYPES,
  DATA_KEYS,
  RADIUS_MATRIX,
} from './constants';
import { findParentInstance } from './utils/nodeGetters';

// --- private functions
/**
 * @description Sets the `annotationText` on a given node’s settings object.
 *
 * @kind function
 * @name setAnnotationTextSettings
 ()
 * @param {string} annotationText The text to add to the node’s settings.
 * @param {string} annotationSecondaryText Optional text to add to the node’s settings.
 * @param {string} annotationType The type of annotation (`custom`, `component`, `style`).
 * @param {Object} nodeId The `id` for the Figma node receiving the settings update.
 * @param {Object} page The page containing the node to be annotated.
 *
 * @private
 */
const setAnnotationTextSettings = (
  annotationText: string,
  annotationSecondaryText: string,
  annotationType: 'component' | 'custom' | 'keystop' | 'style',
  nodeId: string,
  page: any,
): void => {
  let nodeSettings = getNodeSettings(page, nodeId);

  // set `annotationText` on the node settings
  if (!nodeSettings) {
    nodeSettings = {
      id: nodeId,
      annotationText,
      annotationSecondaryText,
      annotationType,
    };
  } else {
    nodeSettings.annotationText = annotationText;
    nodeSettings.annotationSecondaryText = annotationSecondaryText;
    nodeSettings.annotationType = annotationType;
  }

  // commit the settings update
  setNodeSettings(page, nodeSettings);

  return null;
};

/**
 * @description Checks the component name for the presence of `☾` or `☼` icons. If neither icon is
 * found, the component is most-likely a legacy component.
 *
 * @kind function
 * @name isLegacyByName
 *
 * @param {string} name The full name of the node.
 *
 * @returns {boolean} Bool declaring `true` for legacy component and `false` for newer component.
 *
 * @private
 */
const isLegacyByName = (name: string): boolean => {
  let isLegacy: boolean = true;

  isLegacy = !name.includes('☾');
  if (isLegacy) { isLegacy = !name.includes('☼'); }

  return isLegacy;
};

/**
 * @description Checks the component name against a list of known Foundation names and sets
 * `annotationType` appropriately.
 *
 * @kind function
 * @name checkNameForType
 *
 * @param {string} name The full name of the node.
 *
 * @returns {string} The `annotationType` – either `component` or `style`.
 *
 * @private
 */
const checkNameForType = (name: string): 'component' | 'style' => {
  let annotationType: 'component' | 'style' = 'component';

  // only appy type-check to internal builds
  if (isInternal()) {
    // name substrings, exclusive to Foundations
    const foundations: Array<string> = ['Divider', 'Flood', 'Icons', 'Illustration', 'Logos'];
    let libraryName: string = name;

    // process checks based on whether or not the source is from a legacy or new library
    if (isLegacyByName(name)) {
      // grab the first segment of the name (before the first “/”) – top-level Kit name
      libraryName = name.split('/')[0]; // eslint-disable-line prefer-destructuring

      // set up some known exceptions (remove the text that would trigger a type change)
      libraryName = libraryName.replace('(Dual Icons)', '');
    }

    // check if one of the foundation substrings exists in the `libraryName`
    if (foundations.some(foundation => libraryName.indexOf(foundation) >= 0)) {
      annotationType = 'style';
    }
  }

  return annotationType;
};

/**
 * @description Removes any library/grouping names from the node name.
 *
 * @kind function
 * @name cleanName
 *
 * @param {string} name The full name of the node.
 *
 * @returns {string} The last segment of the node name as a string.
 *
 * @private
 */
const cleanName = (name: string): string => {
  if (!name.trim()) { return 'Unknown'; }

  let cleanedName: string = name;

  // only apply changes to internal builds
  if (isInternal()) {
    if (isLegacyByName(name)) {
      // take only the last segment of the name (after a “/”, if available)
      // ignore segments that begin with a “w” as-in “…Something w/ Icon”
      cleanedName = cleanedName.split(/(?:[^w|^\s])(\/)/).pop();
    } else {
      cleanedName = cleanedName.replace('☾ ', '');
      cleanedName = cleanedName.replace('☼ ', '');
      cleanedName = cleanedName.replace('☾', '');
      cleanedName = cleanedName.replace('☼', '');
    }

    // otherwise, fall back to the full node name
    cleanedName = !cleanedName.trim() ? name : cleanedName;
  }

  return cleanedName;
};

/**
 * @description Color names in the library contain more information than necessary for
 * speccing (i.e. “Blue / Blue-60”)—only use the bit after the last “/”, and change any hyphens to
 * spaces for easier reading.
 *
 * @kind function
 * @name cleanColorName
 *
 * @param {string} name The original name of the color.
 *
 * @returns {string} The cleaned name of the color for the annotation.
 *
 * @private
 */
const cleanColorName = (name: string): string => {
  let cleanedName = name;
  cleanedName = cleanedName.split(' / ').pop();
  cleanedName = cleanedName.replace(/-/g, ' ');
  return cleanedName;
};

/**
 * @description Set the style (Foundation) text based on applied effect or fill styles. Effect
 * styles take precedence over fill styles in the hierarchy. Color names (fill styles) are
 * “cleaned” to remove duplication and hyphens using `cleanColorName`.
 *
 * @kind function
 * @name setStyleText
 *
 * @param {Object} options Object containing the lookup IDs for effect and/or fill.
 *
 * @returns {string} The cleaned name of the color for the annotation.
 *
 * @private
 */
const setStyleText = (options: {
  effectStyleId?: string | symbol,
  fillStyleId?: string | symbol,
  strokeStyleId?: string | symbol,
  textStyleId?: string | symbol,
  textAlignHorizontal?: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED',
}): {
  textToSet: string,
  subtextToSet: string,
} => {
  const {
    effectStyleId,
    fillStyleId,
    strokeStyleId,
    textStyleId,
    textAlignHorizontal,
  } = options;
  let textToSet: string = null;
  let subtextToSet: string = null;
  const subtextToSetArray: Array<string> = [];

  // load the styles
  const effectStyle: BaseStyle = effectStyleId !== figma.mixed
    ? figma.getStyleById(effectStyleId as string) : null;
  const fillStyle: BaseStyle = fillStyleId !== figma.mixed
    ? figma.getStyleById(fillStyleId as string) : null;
  const strokeStyle: BaseStyle = strokeStyleId !== figma.mixed
    ? figma.getStyleById(strokeStyleId as string) : null;
  const textStyle: BaseStyle = textStyleId !== figma.mixed
    ? figma.getStyleById(textStyleId as string) : null;

  // ------- set text (based on hierarchy Text > Effect > Fill > Stroke)

  // set type
  if (textStyle && textStyle.remote) {
    textToSet = cleanName(textStyle.name);

    // set effect, fill, and stroke as override(s)
    if (effectStyle && effectStyle.remote) { subtextToSetArray.push(cleanName(effectStyle.name)); }
    if (strokeStyle && strokeStyle.remote) { subtextToSetArray.push(`Stroke: ${cleanColorName(strokeStyle.name)}`); }
    if (fillStyle && fillStyle.remote) { subtextToSetArray.push(cleanColorName(fillStyle.name)); }
  }

  if (!textToSet && effectStyle && effectStyle.remote) {
    // set effect name as main text
    textToSet = cleanName(effectStyle.name);

    // set fill and stroke color(s) as override(s)
    if (strokeStyle && strokeStyle.remote) { subtextToSetArray.push(`Stroke: ${cleanColorName(strokeStyle.name)}`); }
    if (fillStyle && fillStyle.remote) { subtextToSetArray.push(cleanColorName(fillStyle.name)); }
  }

  if (!textToSet && fillStyle && fillStyle.remote) {
    // set fill color as main text
    textToSet = cleanColorName(fillStyle.name);

    // set stroke color as override
    if (strokeStyle && strokeStyle.remote) { subtextToSetArray.push(`Stroke: ${cleanColorName(strokeStyle.name)}`); }
  }

  if (!textToSet && strokeStyle && strokeStyle.remote) {
    // set stroke color as main text
    textToSet = `Stroke: ${cleanColorName(strokeStyle.name)}`;
  }

  // check type for alignment
  if (textAlignHorizontal && textAlignHorizontal !== 'LEFT') {
    let textAlignmentOverride: string = null;
    const textAlignment = toSentenceCase(textAlignHorizontal);
    textAlignmentOverride = `Align: ${textAlignment}`;
    subtextToSetArray.push(textAlignmentOverride);
  }

  subtextToSet = subtextToSetArray.join(', ');

  return {
    textToSet,
    subtextToSet,
  };
};

/**
 * @description Looks through a component’s inner nodes primarily for Icon nodes. Checks those
 * nodes for presence in the main component. If the icon node cannot be found in the main
 * it is declared an override. Returns a text string based on the override(s) and context.
 *
 * @kind function
 * @name parseOverrides
 *
 * @param {Object} parentNode The Figma parentNode object.
 *
 * @returns {string} Text containing information about the override(s).
 *
 * @private
 */
const parseOverrides = (parentNode: any): string => {
  const overridesText: Array<string> = [];
  // check for styles
  const {
    effectStyleId,
    fillStyleId,
    strokeStyleId,
    textStyleId,
    textAlignHorizontal,
  } = parentNode;

  // set styles text
  const {
    textToSet,
    subtextToSet,
  } = setStyleText({
    effectStyleId,
    fillStyleId,
    strokeStyleId,
    textStyleId,
    textAlignHorizontal,
  });

  // add styles to overrides
  if (textToSet) { overridesText.push(textToSet); }
  if (subtextToSet) { overridesText.push(subtextToSet); }

  // find base-level inner parentNodes and check if they are icon overrides
  // `parentNode.children` only gives us immediate children; `parentNode.findOne(…` gives us
  // all children, flattened, and iterates.
  //
  // only check for icon overrides if the top-level component has “button” in its name
  if (parentNode.name.toLowerCase().includes('button') || parentNode.name.includes('FAB')) {
    parentNode.findOne((node) => {
      // lowest-level, visible node in a branch
      if (isVisible(node) && !node.children) {
        /**
         * @description Given a node inside of a component instance, find a parent
         * component instance that matches the naming scheme of an icon.
         *
         * @kind function
         * @name isOverrideableIconNode
         *
         * @param {Object} innerNode A Figma node object (`SceneNode`).
         *
         * @returns {boolean} Set to `true` if `innerNode` is an icon.
         *
         * @private
         */
        const isOverrideableIconNode = (innerNode) => {
          let { parent } = innerNode;
          let currentNode = innerNode;
          let isOverrideableIcon: boolean = false;

          if (
            !currentNode.name.toLowerCase().includes('button')
            && (currentNode.name.toLowerCase().includes('provisional') || currentNode.name.toLowerCase().includes('placeholder'))
          ) {
            isOverrideableIcon = true;
          }

          if (!isOverrideableIcon && parent) {
            // iterate until the parent id matches queried node id
            while (parent && parent.id !== parentNode.id) {
              currentNode = parent;

              // look for Icon overrides – based on finding a container (parent) node
              // that includes “icon” in the name, but not also “button”
              if (
                !currentNode.name.toLowerCase().includes('button')
                && (currentNode.name.toLowerCase().includes('provisional') || currentNode.name.toLowerCase().includes('placeholder'))
              ) {
                isOverrideableIcon = true;
              }
              parent = currentNode.parent;
            }
          }

          return isOverrideableIcon;
        };

        // finds the first component instance above the low-level node
        const parentInstanceNode = findParentInstance(node);

        if (parentInstanceNode) {
          // check if parentInstanceNode is an icon
          const isOverrideableIcon: boolean = isOverrideableIconNode(parentInstanceNode);

          if (isOverrideableIcon) {
            // grab cleaned name (last portion)
            const overrideName: string = cleanName(parentInstanceNode.name);

            // ignore placeholder/provisional (not overrides)
            if (
              !overrideName.toLowerCase().includes('placeholder')
              && !overrideName.toLowerCase().includes('provisional')
            ) {
              // set the icon name as an override
              overridesText.push(overrideName);
            }
          }
        }
      }
    });
  }

  // compiles overrides into `setOverridesText` string
  // only apply label to internal builds
  const uniqueOverridesText = Array.from(new Set(overridesText));
  let setOverridesText: string = null;
  if (isInternal() && uniqueOverridesText.length > 0) {
    let label: string = 'Override';
    if (uniqueOverridesText.length > 1) {
      label = 'Overrides';
    }
    setOverridesText = `${label}: ${uniqueOverridesText.join(', ')}`;
  } else if (!isInternal() && uniqueOverridesText.length > 0) {
    setOverridesText = uniqueOverridesText.join(', ');
  }

  return setOverridesText;
};

/**
 * @description Parses a layer name into variants (`key` and `value`). Checks the parent
 * set’s peer data and removes any variants that should be ignored. Compiles the variants
 * and set name into a single name string.
 *
 * @kind function
 * @name parseVariants
 *
 * @param {string} variantLayerName The current node name for the variant.
 * @param {Object} componentSetNode The Figma ComponentSetNode object.
 *
 * @returns {string} The proper token name for the variant.
 *
 * @private
 */
const parseVariants = (
  variantLayerName: string,
  componentSetNode: ComponentSetNode,
): string => {
  // grab clean name from set node
  const setName = cleanName(componentSetNode.name);
  let nameWithVariants = `${setName} ${variantLayerName}`;

  let variants: Array<{
    key: string,
    value: string,
  }> = [];
  const nameVariantArray: Array<string> = variantLayerName.split(',');

  // extract variants from variant layer name
  nameVariantArray.forEach((variantKey) => {
    const variantKeyStripped = variantKey.trim();
    const variantKeyArray: Array<string> = variantKeyStripped.split('=');
    if (variantKeyArray.length === 2) {
      const keyIndex: number = 0;
      const valueIndex: number = 1;
      const key: string = variantKeyArray[keyIndex];
      const value: string = variantKeyArray[valueIndex];

      variants.push({
        key,
        value,
      });
    }
  });

  if (variants.length > 0) {
    // remove variants that should be ignored
    const peerNodeData = getPeerPluginData(componentSetNode);
    if (peerNodeData && peerNodeData.variants) {
      peerNodeData.variants.forEach((variantIgnoreItem) => {
        if (
          variantIgnoreItem.ignore
          && existsInArray(variants, variantIgnoreItem.key, 'key')
        ) {
          variants = updateArray(variants, variantIgnoreItem, 'key', 'remove');
        }
      });
    }

    // ----------- set up name with variants
    // if the variant value is a boolean, use the key, otherwise use the value
    const withVariantsArray: Array<string> = [];
    variants.forEach((variant) => {
      const nameTest: string = variant.value.toLowerCase();
      if (nameTest === 'true') {
        withVariantsArray.push(variant.key);
      } else if (nameTest !== 'false') {
        withVariantsArray.push(variant.value);
      }
    });
    nameWithVariants = `${setName} ${withVariantsArray.join(' ')}`;
  }

  return nameWithVariants;
};

// --- main Identifier class function
/**
 * @description A class to handle identifying a Figma node as a valid part of the Design System.
 *
 * @class
 * @name Identifier
 *
 * @constructor
 *
 * @property isMercadoMode A feature-flag (`isMercadoMode`) used to expose features specific to
 * the Mercado Design Library.
 * @property messenger An instance of the Messenger class.
 * @property node The node that needs identification.
 * @property page The Figma page that contains the node.
 * @property shouldTerminate A boolean that tells us whether or not the GUI should remain open
 * at the end of the plugin’s current task.
 */
export default class Identifier {
  isMercadoMode: boolean;
  node: any;
  messenger: any;
  page: PageNode;
  shouldTerminate: boolean;

  constructor({
    for: node,
    data: page,
    isMercadoMode,
    messenger,
    shouldTerminate = false,
  }) {
    this.isMercadoMode = isMercadoMode;
    this.node = node;
    this.messenger = messenger;
    this.page = page;
    this.shouldTerminate = shouldTerminate;
  }

  /**
   * @description Retrieve the node’s corner radius values and matches them against the
   * `RADIUS_MATRIX` to retrieve a design library corner radius token.
   *
   * @kind function
   * @name getCornerToken
   *
   * @returns {Object} A result object containing success/error status and log/toast messages.
   */
  getCornerToken() {
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

    // check that all radii are the same
    let radiiIsUnified = false;
    const node = this.node as FrameNode | RectangleNode;
    if (
      (node.topLeftRadius === node.topRightRadius)
      && (node.topRightRadius === node.bottomLeftRadius)
      && (node.bottomLeftRadius === node.bottomRightRadius)
    ) {
      radiiIsUnified = true;
    }

    // return an error if the radii are not the same
    if (!radiiIsUnified) {
      result.status = 'error';
      result.messages.log = 'Radii are not the same';
      result.messages.toast = 'Each corner radius must be the same ⏹';
      return result;
    }

    // corners are the same, so set to one of them
    let cornerValue = node.topLeftRadius;

    // set cornerValue to valid Mercado Base Unit values
    if (cornerValue < 5) {
      cornerValue = 4;
    } else if (cornerValue < 10) {
      cornerValue = 8;
    } else if (cornerValue < 20) {
      cornerValue = 16;
    } else if (cornerValue < 30) {
      cornerValue = 24;
    }

    // throw back a radius that is too large
    if (cornerValue > 24) {
      result.status = 'error';
      result.messages.log = 'Radius too big';
      result.messages.toast = 'Each corner radius must be under 30';
      return result;
    }

    // retrive the token based on the corner value
    const radiusItem = RADIUS_MATRIX.find(radius => radius.unit === cornerValue);
    if (radiusItem) {
      // sets symbol type to `foundation` or `component` based on name checks
      const symbolType: 'style' = 'style';
      const textToSet: string = radiusItem.token;
      const subtextToSet = null;

      // set `textToSet` on the node settings as the component name
      // set optional `subtextToSet` on the node settings based on existing overrides
      setAnnotationTextSettings(textToSet, subtextToSet, symbolType, this.node.id, this.page);

      // log the official name alongside the original node name and set as success
      result.status = 'success';
      result.messages.log = `Name in library for “${this.node.name}” corner radius is “${textToSet}”`;
      return result;
    }

    // otherwise matching token could not be found; return an error
    result.status = 'error';
    result.messages.log = 'No radius token match';
    result.messages.toast = 'Hmm… we could not find a token for this radius';
    return result;
  }

  /**
   * @description Identifies the main name of a component OR the effect and adds the name to
   * the node’s `annotationText` settings object: Main Component identification is achieved
   * by ensuring a `mainComponent` is attached to the instance and then parsing the main’s
   * `name` and `description` for additional identifying information. If a node is not
   * attached to a Main Component, it is checked for remote style IDs. If found, the style(s)
   * are labeled as Foundation elements or overrides to the main Component.
   *
   * @kind function
   * @name getLibraryName
   *
   * @returns {Object} A result object containing success/error status and log/toast messages.
   */
  getLibraryName() {
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

    // check for library `mainComponent` or styling IDs
    // not much else we can do at the moment if none of it exists
    if (
      !this.node.mainComponent
      && !this.node.effectStyleId
      && !this.node.fillStyleId
      && !this.node.strokeStyleId
      && !this.node.textStyleId
    ) {
      result.status = 'error';
      result.messages.log = 'Node is not connected to a Main Component or library styles';
      result.messages.toast = '🆘 This layer is not a component or styled.';
      return result;
    }

    this.messenger.log(`Simple name for node: ${this.node.name}`);

    // locate a `mainComponent`
    if (this.node.mainComponent) {
      const { mainComponent } = this.node;

      this.messenger.log(`Main Component name for node: ${mainComponent.name}`);

      // sets symbol type to `foundation` or `component` based on name checks
      const symbolType: 'component' | 'style' = checkNameForType(mainComponent.name);
      // take only the last segment of the name (after a “/”, if available)
      let textToSet: string = cleanName(mainComponent.name);
      const subtextToSet = parseOverrides(this.node);

      // check variant status
      const isVariant = mainComponent.parent
        && (mainComponent.parent.type === CONTAINER_NODE_TYPES.componentSet);

      if (isVariant) {
        const componentSet = mainComponent.parent;
        textToSet = parseVariants(textToSet, componentSet);
      }

      // check for annotation override in Stapler
      const peerNodeData = getPeerPluginData(mainComponent);
      if (peerNodeData && peerNodeData.annotationText) {
        const { annotationText } = peerNodeData;
        textToSet = annotationText;
      }

      // set `textToSet` on the node settings as the component name
      // set optional `subtextToSet` on the node settings based on existing overrides
      setAnnotationTextSettings(textToSet, subtextToSet, symbolType, this.node.id, this.page);

      // log the official name alongside the original node name and set as success
      result.status = 'success';
      result.messages.log = `Name in library for “${this.node.name}” is “${textToSet}”`;
      return result;
    }

    // locate shared effect, fill, stroke, or type styles
    if (
      this.node.effectStyleId
      || this.node.fillStyleId
      || this.node.strokeStyleId
      || this.node.textStyleId
    ) {
      const {
        effectStyleId,
        fillStyleId,
        strokeStyleId,
        textStyleId,
        textAlignHorizontal,
      } = this.node;

      // set text
      const {
        textToSet,
        subtextToSet,
      } = setStyleText({
        effectStyleId,
        fillStyleId,
        strokeStyleId,
        textStyleId,
        textAlignHorizontal,
      });

      if (textToSet) {
        // set `annotationText` on the node settings as the effect name
        setAnnotationTextSettings(textToSet, subtextToSet, 'style', this.node.id, this.page);

        // log the official name alongside the original node name and set as success
        result.status = 'success';
        result.messages.log = `Style Name in design library for “${this.node.name}” is “${textToSet}”`;
        return result;
      }
    }

    // could not find a matching node in a connected design library
    result.status = 'error';
    result.messages.log = `${this.node.id} was not found in a connected design library`;
    result.messages.toast = '😢 This layer could not be found in a connected design library.';
    return result;
  }

  /**
   * @description Checks the node’s settings object for the existence of stop-related data
   * and either updates that data with a new position, or creates the data object with the
   * initial position and saves it to the node. Position is calculated by reading the
   * stop list data from the nodes top-level container frame. If `position` is _not_
   * supplied, the main underlying assumption is that the node being set is going to be in the
   * next highest position in the list and needs to be added to the list. If `position` is
   * supplied, the assumption is that we are simply updating the node data, and the keystop
   * list does not need to be touched.
   *
   * @kind function
   * @name getSetStop
   *
   * @param {string} type The type of annotation to repair (`keystop` or `label`).
   * @param {number} position An optional number to override the counter.
   *
   * @returns {Object} A result object containing success/error status and log/toast messages.
   */
  getSetStop(
    type: PluginStopType,
    position?: number,
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

    // find the top frame
    const topFrame: FrameNode = findTopFrame(this.node);

    if (!topFrame) {
      result.status = 'error';
      result.messages.log = `Node “${this.node.name}” needs to be in a frame`;
      result.messages.toast = 'Your selection needs to be in an outer frame';
      return result;
    }

    // get top frame stop list
    const listDataType = DATA_KEYS[`${type}List`];
    const frameKeystopListData = JSON.parse(topFrame.getPluginData(listDataType) || null);
    let frameKeystopList: Array<{
      id: string,
      position: number,
    }> = [];
    if (frameKeystopListData) {
      frameKeystopList = frameKeystopListData;
    }

    // set new position based on list length
    // (we always assume `getSetKeystop` has been fed the node in order)
    let positionToSet = frameKeystopList.length + 1;
    if (position) {
      positionToSet = position;
    } else {
      // add the new node to the list with position
      frameKeystopList.push({
        id: this.node.id,
        position: positionToSet,
      });

      // set/update top frame stop list
      topFrame.setPluginData(
        listDataType,
        JSON.stringify(frameKeystopList),
      );
    }

    // convert position to string
    const textToSet = `${positionToSet}`;

    // retrieve the node data
    const nodeDataType = DATA_KEYS[`${type}NodeData`];
    let nodeData: {
      annotationText: string,
      annotationSecondaryText?: string,
      keys?: Array<PluginKeystopKeys>,
      labels?: PluginAriaLabels,
      role?: string,
      heading?: PluginHeading,
    } = JSON.parse(this.node.getPluginData(nodeDataType) || null);

    // set `annotationText` data on the node
    if (!nodeData) {
      nodeData = {
        annotationText: textToSet,
      };
    } else {
      nodeData.annotationText = textToSet;
    }

    // check for assigned keys, if none exist (`undefined` or `null`):
    // this check will only happen if keys have never been attached to this stop.
    // if the component is updated after this stop has been altered, the updates will be ignored.
    const peerNodeData = getPeerPluginData(this.node);
    if (!nodeData.keys && peerNodeData?.keys) {
      nodeData.keys = peerNodeData.keys;
    }
    if (!nodeData.labels && peerNodeData?.labels) {
      nodeData.labels = peerNodeData.labels;
    }
    if (!nodeData.role && peerNodeData?.role) {
      nodeData.role = peerNodeData.role;
    }
    if (!nodeData.heading && peerNodeData?.heading) {
      nodeData.heading = peerNodeData.heading;
    }

    // commit the updated data
    this.node.setPluginData(
      nodeDataType,
      JSON.stringify(nodeData),
    );

    result.status = 'success';
    result.messages.log = `${type} stop position ${textToSet} set for “${this.node.name}”`;
    return result;
  }

  /**
   * @description Checks the node’s settings object for the existence of `annotationText` and
   * and that `annotationType` is 'custom' (Component and Style annotations can be easily updated
   * and need to be rechecked each time, whereas Custom annotations do not.
   *
   * @kind function
   * @name hasCustomText
   *
   * @returns {Object} A result object containing success/error status and log/toast messages.
   */
  hasCustomText() {
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

    // get node settings
    const nodeSettings = getNodeSettings(this.page, this.node.id);

    // check for existing `annotationText`
    if (
      nodeSettings
      && nodeSettings.annotationText
      && (nodeSettings.annotationType === 'custom')
    ) {
      result.status = 'success';
      result.messages.log = `Custom text set for “${this.node.name}” is “${nodeSettings.annotationText}”`;
    } else {
      result.status = 'error';
      result.messages.log = `No custom text is set for “${this.node.name}”`;
    }

    return result;
  }

  /**
   * @description Displays a dialog box to allow the user to set custom annotation text and
   * adds the text to the node’s settings object.
   *
   * @kind function
   * @name setText
   *
   * @param {Function} callbackMain A callback function.
   *
   * @returns {Object} A result object containing success/error status and log/toast messages.
   */
  setText(callbackMain): any {
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

    // check settings for existing value
    const nodeSettings: any = getNodeSettings(this.page, this.node.id);
    let initialValue: string = cleanName(this.node.name);

    if (nodeSettings && nodeSettings.annotationText) {
      initialValue = nodeSettings.annotationText;
    }

    const getInputFromUser = (callback: Function): any => {
      let userInputIsOpen: boolean = true;
      let userInput: string = null;

      // switch plugin UI to user input state
      resizeGUI('input', figma.ui);
      figma.ui.postMessage({
        action: 'showInput',
        payload: { initialValue },
      });

      // set a one-time use listener for feedback from the UI
      figma.ui.once('message', (
        msg: {
          inputType: 'cancel' | 'submit',
          inputValue: string,
          navType: string,
        },
      ): void => {
        const resetGUI = (): void => {
          if (!this.shouldTerminate) {
            // switch plugin UI to navigation state
            let size = 'default';

            if (this.isMercadoMode) {
              size = 'mercadoDefault';
            }

            figma.ui.postMessage({ action: 'hideInput' });
            resizeGUI(size, figma.ui);
          }
        };

        // watch for submit
        if (msg.inputType === 'submit') {
          if (msg.inputValue && msg.inputValue !== '') {
            userInput = msg.inputValue;
            this.messenger.log(`User input received: ${msg.inputValue}`);
            resetGUI();
            userInputIsOpen = false;
          } else {
            this.messenger.log('User input is empty', 'error');
            // TKTK handle empty state validation
          }
        } else if (userInputIsOpen) {
          resetGUI();
          userInputIsOpen = false;
        }
      });

      // wait on the user input
      const checkUserInput = (): Function | NodeJS.Timeout => {
        if (userInputIsOpen) {
          return setTimeout(() => {
            checkUserInput();
          }, 200);
        }
        return callback(userInput);
      };
      return checkUserInput();
    };

    const setStatus = (customInput?: string): any => {
      if (!customInput) {
        // most likely the user canceled the input
        result.status = 'error';
        result.messages.log = 'Set text was canceled by user';
        return callbackMain(result);
      }

      // set `annotationText` on the node settings as the custom text
      setAnnotationTextSettings(customInput, null, 'custom', this.node.id, this.page);

      // log the custom name alongside the original node name and set as success
      result.status = 'success';
      result.messages.log = `Custom Text set for “${this.node.name}” is “${customInput}”`;
      return callbackMain(result);
    };

    return getInputFromUser(setStatus);
  }
}
