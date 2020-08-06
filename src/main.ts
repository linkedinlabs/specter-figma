// ++++++++++++++++++++++++++ Specter for Figma +++++++++++++++++++++++++++
import App from './App';
import Messenger from './Messenger';
import {
  awaitUIReadiness,
  loadFirstAvailableFontAsync,
  resizeGUI,
} from './Tools';
import { DATA_KEYS, TYPEFACES } from './constants';

// GUI management -------------------------------------------------

/**
 * @description Shuts down the plugin and closes the GUI.
 *
 * @kind function
 * @name closeGUI
 *
 * @returns {null}
 */
const closeGUI = (): void => {
  // close the UI without suppressing error messages
  figma.closePlugin();
  return null;
};

/**
 * @description Enables the plugin GUI within Figma.
 *
 * @kind function
 * @name showGUI
 *
 * @returns {null} Shows a Toast in the UI if nothing is selected.
 */
const showGUI = (isMercadoMode?: boolean): void => {
  // set UI size
  let size = 'default';

  if (isMercadoMode) {
    size = 'mercadoDefault';
  }
  resizeGUI(size, figma.ui);

  // set mercado mode banner
  figma.ui.postMessage({
    action: 'setMercadoMode',
    payload: isMercadoMode,
  });

  // show UI
  figma.ui.show();

  return null;
};

// watch for commands -------------------------------------------------

/**
 * @description Takes a unique string (`type`) and calls the corresponding action
 * in the App class. Also does some housekeeping duties such as pre-loading typefaces
 * and managing the GUI.
 *
 * @kind function
 * @name dispatcher
 * @param {Object} action An object comprised of `type`, a string representing
 * the action received from the GUI and `visual` a boolean indicating if the
 * command came from the GUI or the menu.
 * @returns {null}
 */
const dispatcher = async (action: {
  type: string,
  visual: boolean,
}) => {
  // if the action is not visual, close the plugin after running
  const shouldTerminate: boolean = !action.visual;

  // retrieve existing options
  const lastUsedOptions: {
    isMercadoMode: boolean,
  } = await figma.clientStorage.getAsync(DATA_KEYS.options);

  // set mercado mode flag
  let isMercadoMode: boolean = false;
  if (lastUsedOptions && lastUsedOptions.isMercadoMode !== undefined) {
    isMercadoMode = lastUsedOptions.isMercadoMode;
  }

  // pass along some GUI management and navigation functions to the App class
  const app = new App({
    closeGUI,
    dispatcher,
    isMercadoMode,
    shouldTerminate,
    showGUI,
  });

  // run the action in the App class based on type
  const runAction = async (actionType: string) => {
    switch (actionType) {
      case 'annotate':
        app.annotateLayer();
        break;
      case 'annotate-custom':
        app.annotateLayerCustom();
        break;
      case 'annotate-spacing-left':
        app.annotateSpacingOnly('left');
        break;
      case 'annotate-spacing-right':
        app.annotateSpacingOnly('right');
        break;
      case 'annotate-spacing-top':
        app.annotateSpacingOnly('top');
        break;
      case 'annotate-spacing-bottom':
        app.annotateSpacingOnly('bottom');
        break;
      case 'annotate-spacing-al-padding':
        app.annotateSpacingALPadding();
        break;
      case 'bounding':
        app.drawBoundingBoxes();
        break;
      case 'bounding-multi':
        app.drawBoundingBoxes('multiple');
        break;
      case 'corners':
        // app.annotateMeasurement();
        console.log('measure corners 📐'); // eslint-disable-line no-console
        break;
      case 'measure':
        app.annotateMeasurement();
        break;
      case 'info':
        setTimeout(() => {
          resizeGUI('info', figma.ui);
        }, 190);
        figma.ui.postMessage({
          action: 'showInfo',
        });
        break;
      case 'info-hide': {
        setTimeout(() => {
          // set UI size
          let size = 'default';

          if (isMercadoMode) {
            size = 'mercadoDefault';
          }
          resizeGUI(size, figma.ui);
        }, 180);

        // switch views
        figma.ui.postMessage({
          action: 'hideInfo',
        });
        break;
      }
      case 'mercado-mode-toggle': {
        await App.toggleMercadoMode();

        // refresh options since they have changed
        const refreshedOptions: {
          isMercadoMode: boolean,
        } = await figma.clientStorage.getAsync(DATA_KEYS.options);

        if (refreshedOptions && refreshedOptions.isMercadoMode !== undefined) {
          isMercadoMode = refreshedOptions.isMercadoMode;
        }

        showGUI(isMercadoMode);
        break;
      }
      default:
        showGUI(isMercadoMode);
    }
  };

  // load the typeface and then run the action
  const runActionWithTypefaces = async (actionType: string) => {
    // typefaces should be loaded before running action
    const typefaceToUse: FontName = await loadFirstAvailableFontAsync(TYPEFACES);

    // set the currently-loaded typeface in page settings
    if (typefaceToUse) {
      figma.currentPage.setPluginData('typefaceToUse', JSON.stringify(typefaceToUse));
    }

    // run the action
    await runAction(actionType);
  };
  await runActionWithTypefaces(action.type);

  return null;
};
export default dispatcher;

/**
 * @description Acts as the main wrapper function for the plugin. Run by default
 * when Figma calls the plugin.
 *
 * @kind function
 * @name main
 *
 * @returns {null}
 */
const main = async () => {
  // set up logging
  const messenger = new Messenger({ for: figma, in: figma.currentPage });

  // set up the UI, hidden by default -----------------------------------------
  figma.showUI(__html__, { visible: false }); // eslint-disable-line no-undef

  // make sure UI has finished setting up
  await awaitUIReadiness(messenger);

  // watch menu commands -------------------------------------------------
  if (figma.command) {
    dispatcher({
      type: figma.command,
      visual: false,
    });
  }

  // watch GUI action clicks -------------------------------------------------
  figma.ui.onmessage = (msg: { navType: string }): void => {
    // watch for nav actions and send to `dispatcher`
    if (msg.navType) {
      dispatcher({
        type: msg.navType,
        visual: true,
      });
    }

    // ignore everything else
    return null;
  };
};

// run main as default
main();
