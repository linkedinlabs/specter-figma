import {
  findParentInstance,
  getLayerSettings,
  isInternal,
  isVisible,
  resizeGUI,
  setLayerSettings,
  toSentenceCase,
} from './Tools';

// --- private functions
/**
 * @description Sets the `annotationText` on a given layer’s settings object.
 *
 * @kind function
 * @name setAnnotationTextSettings
 ()
 * @param {string} annotationText The text to add to the layer’s settings.
 * @param {string} annotationSecondaryText Optional text to add to the layer’s settings.
 * @param {string} annotationType The type of annotation (`custom`, `component`, `style`).
 * @param {Object} layerId The `id` for the Figma layer receiving the settings update.
 * @param {Object} page The page containing the layer to be annotated.
 *
 * @private
 */
const setAnnotationTextSettings = (
  annotationText: string,
  annotationSecondaryText: string,
  annotationType: string,
  layerId: string,
  page: any,
): void => {
  let layerSettings = getLayerSettings(page, layerId);

  // set `annotationText` on the layer settings
  if (!layerSettings) {
    layerSettings = {
      id: layerId,
      annotationText,
      annotationSecondaryText,
      annotationType,
    };
  } else {
    layerSettings.annotationText = annotationText;
    layerSettings.annotationSecondaryText = annotationSecondaryText;
    layerSettings.annotationType = annotationType;
  }

  // commit the settings update
  setLayerSettings(page, layerSettings);

  return null;
};

/**
 * @description Checks the component name for the presence of `☾` or `☼` icons. If neither icon is
 * found, the component is most-likely a legacy component.
 *
 * @kind function
 * @name isLegacyByName
 *
 * @param {string} name The full name of the Layer.
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
 * @param {string} name The full name of the Layer.
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
 * @description Removes any library/grouping names from the layer name.
 *
 * @kind function
 * @name cleanName
 *
 * @param {string} name The full name of the Layer.
 *
 * @returns {string} The last segment of the layer name as a string.
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

    // otherwise, fall back to the full layer name
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
 * @param {string} name The original name of the color
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
  effectStyleId?: string,
  fillStyleId?: string,
  strokeStyleId?: string,
  textStyleId?: string,
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
  const effectStyle: BaseStyle = figma.getStyleById(effectStyleId);
  const fillStyle: BaseStyle = figma.getStyleById(fillStyleId);
  const strokeStyle: BaseStyle = figma.getStyleById(strokeStyleId);
  const textStyle: BaseStyle = figma.getStyleById(textStyleId);

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
 * @description Looks through a component’s inner layers primarily for Icon layers. Checks those
 * layers for presence in the master component. If the icon layer cannot be found in the master
 * it is declared an override. Returns a text string based on the override(s) and context.
 *
 * @kind function
 * @name parseOverrides
 *
 * @param {Object} layer The Figma layer object.
 *
 * @returns {string} Text containing information about the override(s).
 *
 * @private
 */
const parseOverrides = (layer: any): string => {
  const overridesText: Array<string> = [];
  // check for styles
  const {
    effectStyleId,
    fillStyleId,
    strokeStyleId,
    textStyleId,
    textAlignHorizontal,
  } = layer;

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

  // find base-level inner layers and check if they are icon overrides
  // `layer.children` only gives us immediate children; `layer.findOne(…` gives us
  // all children, flattened, and iterates.
  //
  // only check for icon overrides if the top-level component has “button” in its name
  if (layer.name.toLowerCase().includes('button') || layer.name.includes('FAB')) {
    layer.findOne((node) => {
      // lowest-level, visible layer in a branch
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
            // iterate until the parent id matches queried layer id
            while (parent && parent.id !== layer.id) {
              currentNode = parent;

              // look for Icon overrides – based on finding a container (parent) layer
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

// --- main Identifier class function
/**
 * @description A class to handle identifying a Figma layer as a valid part of the Design System.
 *
 * @class
 * @name Identifier
 *
 * @constructor
 *
 * @property layer The layer that needs identification.
 * @property page The Figma page that contains the layer.
 * @property messenger An instance of the Messenger class.
 * @property dispatcher An optional instance of the `dispatcher` function from `main.ts`.
 */
export default class Identifier {
  layer: any;
  page: PageNode;
  messenger: any;
  dispatcher?: Function;
  shouldTerminate: boolean;

  constructor({
    for: layer,
    data: page,
    dispatcher,
    messenger,
    shouldTerminate = false,
  }) {
    this.dispatcher = dispatcher;
    this.layer = layer;
    this.messenger = messenger;
    this.page = page;
    this.shouldTerminate = shouldTerminate;
  }

  /**
   * @description Identifies the master name of a component OR the effect and adds the name to
   * the layer’s `annotationText` settings object: Master Component identification is achieved
   * by ensuring a `masterComponent` is attached to the instance and then parsing the master’s
   * `name` and `description` for additional identifying information. If a layer is not
   * attached to a Master Component, it is checked for remote style IDs. If found, the style(s)
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

    // check for library `masterComponent` or styling IDs
    // not much else we can do at the moment if none of it exists
    if (
      !this.layer.masterComponent
      && !this.layer.effectStyleId
      && !this.layer.fillStyleId
      && !this.layer.strokeStyleId
      && !this.layer.textStyleId
    ) {
      result.status = 'error';
      result.messages.log = 'Layer is not connected to a Master Component or library styles';
      result.messages.toast = '🆘 This layer is not a component or styled.';
      return result;
    }

    this.messenger.log(`Simple name for layer: ${this.layer.name}`);

    // locate a `masterComponent`
    if (this.layer.masterComponent) {
      const { masterComponent } = this.layer;

      this.messenger.log(`Master Component name for layer: ${masterComponent.name}`);

      // sets symbol type to `foundation` or `component` based on name checks
      const symbolType: string = checkNameForType(masterComponent.name);
      // take only the last segment of the name (after a “/”, if available)
      const textToSet: string = cleanName(masterComponent.name);
      const subtextToSet = parseOverrides(this.layer);

      // set `textToSet` on the layer settings as the component name
      // set optional `subtextToSet` on the layer settings based on existing overrides
      setAnnotationTextSettings(textToSet, subtextToSet, symbolType, this.layer.id, this.page);

      // log the official name alongside the original layer name and set as success
      result.status = 'success';
      result.messages.log = `Name in library for “${this.layer.name}” is “${textToSet}”`;
      return result;
    }

    // locate shared effect, fill, stroke, or type styles
    if (
      this.layer.effectStyleId
      || this.layer.fillStyleId
      || this.layer.strokeStyleId
      || this.layer.textStyleId
    ) {
      const {
        effectStyleId,
        fillStyleId,
        strokeStyleId,
        textStyleId,
        textAlignHorizontal,
      } = this.layer;

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
        // set `annotationText` on the layer settings as the effect name
        setAnnotationTextSettings(textToSet, subtextToSet, 'style', this.layer.id, this.page);

        // log the official name alongside the original layer name and set as success
        result.status = 'success';
        result.messages.log = `Style Name in design library for “${this.layer.name}” is “${textToSet}”`;
        return result;
      }
    }

    // could not find a matching layer in a connected design library
    result.status = 'error';
    result.messages.log = `${this.layer.id} was not found in a connected design library`;
    result.messages.toast = '😢 This layer could not be found in a connected design library.';
    return result;
  }

  /**
   * @description Checks the layer’s settings object for the existence of `annotationText` and
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

    // get layer settings
    const layerSettings = getLayerSettings(this.page, this.layer.id);

    // check for existing `annotationText`
    if (
      layerSettings
      && layerSettings.annotationText
      && (layerSettings.annotationType === 'custom')
    ) {
      result.status = 'success';
      result.messages.log = `Custom text set for “${this.layer.name}” is “${layerSettings.annotationText}”`;
    } else {
      result.status = 'error';
      result.messages.log = `No custom text is set for “${this.layer.name}”`;
    }

    return result;
  }

  /**
   * @description Displays a dialog box to allow the user to set custom annotation text and
   * adds the text to the layer’s settings object.
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
    const layerSettings: any = getLayerSettings(this.page, this.layer.id);
    let initialValue: string = cleanName(this.layer.name);

    if (layerSettings && layerSettings.annotationText) {
      initialValue = layerSettings.annotationText;
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

      // listen for feedback from the UI
      figma.ui.onmessage = (
        msg: {
          inputType: 'cancel' | 'submit',
          inputValue: string,
          navType: string,
        },
      ): void => {
        const resetGUI = (): void => {
          if (!this.shouldTerminate) {
            // switch plugin UI to navigation state
            figma.ui.postMessage({ action: 'hideInput' });
            resizeGUI('default', figma.ui);
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
        } else {
          if (userInputIsOpen) {
            resetGUI();
            userInputIsOpen = false;
          }

          // watch for nav actions and send to `dispatcher`
          // `figma.ui.onmessage` can only have one instance at a time
          if (msg.navType) {
            this.dispatcher({
              type: msg.navType,
              visual: true,
            });
          }
        }
      };

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

      // set `annotationText` on the layer settings as the custom text
      setAnnotationTextSettings(customInput, null, 'custom', this.layer.id, this.page);

      // log the custom name alongside the original layer name and set as success
      result.status = 'success';
      result.messages.log = `Custom Text set for “${this.layer.name}” is “${customInput}”`;
      return callbackMain(result);
    };

    return getInputFromUser(setStatus);
  }
}
