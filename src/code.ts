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
 * @name terminatePlugin
 *
 * @returns {null}
 */
const terminatePlugin = (): void => {
  // close the plugin without suppressing error messages
  figma.closePlugin();
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
  payload?: any,
  type: string,
  visual: boolean,
}) => {
  const {
    payload,
    // sessionKey,
    type,
    // visual,
  } = action;

  // if the action is not visual, close the plugin after running
  const shouldTerminate: boolean = !action.visual;

  // retrieve existing options
  const lastUsedOptions: PluginOptions = await figma.clientStorage.getAsync(DATA_KEYS.options);

  // set mercado mode flag
  let isMercadoMode: boolean = false;
  if (lastUsedOptions && lastUsedOptions.isMercadoMode !== undefined) {
    isMercadoMode = lastUsedOptions.isMercadoMode;
  }

  // pass along some GUI management and navigation functions to the App class
  const app = new App({
    isMercadoMode,
    shouldTerminate,
    terminatePlugin,
  });

  // run the action in the App class based on type
  const runAction = async (actionType: string) => {
    switch (actionType) {
      case 'annotate':
        app.annotateNode();
        break;
      case 'annotate-custom':
        app.annotateNodeCustom();
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
        app.annotateCorners();
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
          // let refresh determine size using plugin options for current view
          App.refreshGUI();
        }, 180);

        // switch views
        figma.ui.postMessage({
          action: 'hideInfo',
        });
        break;
      }
      case 'mercado-mode-toggle': {
        await App.toggleMercadoMode();
        break;
      }
      case 'resize':
        App.resizeGUI(payload);
        break;
      case 'setViewContext':
        await App.setViewContext(payload);
        break;
      default:
        await App.showToolbar();
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
  await runActionWithTypefaces(type);

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

  // watch GUI messages -------------------------------------------------
  figma.ui.onmessage = (msg: { action: string, payload: any }): void => {
    const { action, payload } = msg;
    // watch for actions and send to `dispatcher`
    if (action) {
      dispatcher({
        payload,
        type: action,
        visual: true,
        // sessionKey: SESSION_KEY,
      });
    }

    // ignore everything else
    return null;
  };

  // watch selection changes on the Figma level -------------------------------
  figma.on('selectionchange', () => {
    // App.refreshGUI(SESSION_KEY);
    App.refreshGUI();
  });
};

// run main as default
main();
