import {
  getLayerSettings,
  resizeGUI,
  setLayerSettings,
} from './Tools';

// --- private functions
/**
 * @description Sets the `annotationText` on a given layer’s settings object.
 *
 * @kind function
 * @name setAnnotationTextSettings
 * @param {string} annotationText The text to add to the layer’s settings.
 * @param {string} annotationSecondaryText Optional text to add to the layer’s settings.
 * @param {string} annotationType The type of annotation (`custom`, `component`, `style`).
 * @param {Object} layerId The `id` for the Figma layer receiving the settings update.
 * @param {Object} page The page containing the layer to be annotated.
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

/** WIP
 * @description Checks the Kit name against a list of known Foundation Kit names
 * and sets `annotationType` appropriately.
 *
 * @kind function
 * @name isLegacyByName
 * @param {string} name The full name of the Layer.
 * @returns {string} The `annotationType` – either `component` or `style`.
 * @private
 */
const isLegacyByName = (name: string): boolean => {
  let isLegacy: boolean = true;

  isLegacy = !name.includes('☾');
  if (isLegacy) { isLegacy = !name.includes('☼'); }

  return isLegacy;
};

/**
 * @description Checks the Kit name against a list of known Foundation Kit names
 * and sets `annotationType` appropriately.
 *
 * @kind function
 * @name checkNameForType
 * @param {string} name The full name of the Layer.
 * @returns {string} The `annotationType` – either `component` or `style`.
 * @private
 */
const checkNameForType = (name: string): 'component' | 'style' => {
  let annotationType: 'component' | 'style' = 'component';

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

  return annotationType;
};

/**
 * @description Removes any library/grouping names from the layer name
 *
 * @kind function
 * @name cleanName
 * @param {string} name The full name of the Layer.
 * @returns {string} The last segment of the layer name as a string.
 * @private
 */
const cleanName = (name: string): string => {
  let cleanedName: string = name;

  if (isLegacyByName(name)) {
    // take only the last segment of the name (after a “/”, if available)
    // ignore segments that begin with a “w” as-in “…Something w/ Icon”
    cleanedName = name.split(/(?:[^w])(\/)/).pop();
  } else {
    cleanedName = name.replace('☾ ', '');
    cleanedName = name.replace('☼ ', '');
  }

  // otherwise, fall back to the full layer name
  cleanedName = !cleanedName ? name : cleanedName;
  return cleanedName;
};

// /** WIP TKTK
//  * @description Looks through layer overrides and returns a text string based
//  * on the override(s) and context.
//  *
//  * @kind function
//  * @name parseOverrides
//  * @param {Object} layer The Figma js layer object.
//  * @param {Object} document The Figma document object that contains the layer.
//  * @param {Object} workingName The top-level layer name.
//  * @returns {string} Text containing information about the override(s).
//  *
//  * @private
//  */
// const parseOverrides = (layer, document, workingName = null) => {
//   const overridesText: Array<string> = [];

//   // iterate available overrides - based on current Lingo naming schemes and may break
//   // as those change or are updated.
//   fromNative(layer).overrides.forEach((override) => {
//     // only worry about an editable override that has changed and is based on a symbol
//     if (
//       override.editable
//       && !override.isDefault
//       && override.id.includes('symbolID')
//     ) {
//       // current override type/category (always last portion of the path)
//       const overrideTypeId: string = override.path.split('/').pop();
//       const overrideType: string = document.getLayerWithID(overrideTypeId);
//       const overrideTypeName: string = overrideType.name;

//       // current override master symbol (ID is the override value)
//       const overrideSymbol: string = document.getSymbolMasterWithID(override.value);
//       // grab name (sometimes it does not exist if “None” is a changed override)
//       const overrideName: string = overrideSymbol ? overrideSymbol.name : null;

//       if (overrideName) {
//         // look for top-level overrides and Icon overrides - based on
//         // parsing the text of an `overrideTypeName` and making some
//         // comparisons and exceptions
//         if (
//           (
//             overrideTypeName.toLowerCase().includes('icon')
//             && !overrideTypeName.toLowerCase().includes('color')
//             && !overrideTypeName.toLowerCase().includes('🎨')
//             && !overrideTypeName.toLowerCase().includes('button')
//           )
//           || overrideTypeName.toLowerCase() === 'checkbox'
//           || overrideTypeName.toLowerCase() === 'radio'
//           || overrideTypeName.toLowerCase() === 'type'
//           || overrideTypeName.toLowerCase().includes('pebble')
//           || !override.path.includes('/') // excluding “/” gives us top-level overrides
//         ) {
//           // default icon name (usually last element of the name, separated by “/”)
//           let overrideValueName: string = overrideName.split(/(?:[^w])(\/)/).pop();
//           overrideValueName = overrideValueName.replace(`${workingName}`, '');

//           // ---------- set up formatting exceptions
//           // parsing exception for Ghost Entity symbols
//           if (overrideTypeName.toLowerCase().includes('ghost')) {
//             // in some kits, Ghost naming scheme is fine but in the Web kit it
//             // is reversed: “…/Article Ghost/3” instead of “…/3/Article Ghost”
//             if (Number(overrideValueName) === parseInt(overrideValueName, 10)) {
//               overrideValueName = overrideName.split('/').reverse()[1]; // eslint-disable-line prefer-destructuring
//             }
//           }

//           // update `overridesText`
//           overridesText.push(overrideValueName);
//         }
//       }
//     }
//   });

//   let setOverridesText: string = null;
//   if (overridesText.length > 0) {
//     let label: string = 'Override';
//     if (overridesText.length > 1) {
//       label = 'Overrides';
//     }
//     setOverridesText = `${label}: ${overridesText.join(', ')}`;
//   }

//   return setOverridesText;
// };

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
   * @description Identifies the master symbol name of a component and adds the name to the layer’s
   * `annotationText` settings object: The identification is achieved by ensuring a
   * `masterComponent` is attached to the instance and then parsing the master’s `name` and
   * `description` for additional identifying information.
   *
   * @kind function
   * @name getLibraryName
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

      // temp
      this.messenger.log(`Master Component name for layer: ${masterComponent.name}`);

      // sets symbol type to `foundation` or `component` based on name checks
      const symbolType: string = checkNameForType(masterComponent.name);
      // take only the last segment of the name (after a “/”, if available)
      const textToSet: string = cleanName(masterComponent.name);
      // const subtextToSet = parseOverrides(this.layer, this.page, textToSet); // TKTK
      const subtextToSet: string = null; // temporary

      // set `annotationText` on the layer settings as the kit symbol name
      // set option `subtextToSet` on the layer settings based on existing overrides
      setAnnotationTextSettings(textToSet, subtextToSet, symbolType, this.layer.id, this.page);

      // log the official name alongside the original layer name and set as success
      result.status = 'success';
      result.messages.log = `Name in library for “${this.layer.name}” is “${textToSet}”`;
      return result;
    }

    // // locate a shared style in Lingo TKTK
    // if (sharedStyleId) {
    //   const kitStyle = lingoData.layerStyles[sharedStyleId] || lingoData.textStyles[sharedStyleId];

    //   if (kitStyle) {
    //     // take only the last segment of the name (after a “/”, if available)
    //     const textToSet: string = cleanName(kitStyle.name);

    //     // set `annotationText` on the layer settings as the kit layer name
    //     setAnnotationTextSettings(textToSet, null, 'style', this.layer);

    //     // log the official name alongside the original layer name and set as success
    //     result.status = 'success';
    //     result.messages.log = `Style Name in Lingo Kit for “${this.layer.name}” is “${textToSet}”`;
    //     return result;
    //   }
    // }

    // could not find a matching layer in the Lingo Kit
    result.status = 'error';
    result.messages.log = `${this.layer.id} was not found in a connected Lingo Kit`;
    result.messages.toast = '😢 This layer could not be found in a connected Lingo Kit.';
    return result;
  }

  /**
   * @description Checks the layer’s settings object for the existence of `annotationText` and
   * and that `annotationType` is 'custom' (Component and Style annotations can be easily updated
   * and need to be rechecked each time, whereas Custom annotations do not.
   *
   * @kind function
   * @name hasCustomText
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
