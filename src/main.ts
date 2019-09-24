// ++++++++++++++++++++++++++ Specter for Figma +++++++++++++++++++++++++++
import App from './App';
import Messenger from './Messenger';
import {
  CLOSE_PLUGIN_MSG,
  GUI_SETTINGS,
  TYPEFACES,
} from './constants';

// GUI management -------------------------------------------------

/**
 * @description Shuts down the plugin and closes the GUI.
 *
 * @kind function
 * @name closeGUI
 *
 * @throws {CLOSE_PLUGIN_MSG} Throws the command to close the plugin.
 */
const closeGUI = (): void => {
  // close the UI
  throw CLOSE_PLUGIN_MSG;
};

/**
 * @description Enables the plugin GUI within Figma.
 *
 * @kind function
 * @name showGUI
 *
 * @returns {null} Shows a Toast in the UI if nothing is selected.
 */
const showGUI = (): void => {
  // show UI – command: tools
  figma.showUI(__html__, { // eslint-disable-line no-undef
    width: GUI_SETTINGS.default.width,
    height: GUI_SETTINGS.default.height,
  });

  return null;
};

// watch for commands -------------------------------------------------

/**
 * @description Takes a unique string (`type`) and calls the corresponding action
 * in the App class. Also does some housekeeping duties such as pre-loading typefaces,
 * logging errors, or managing the GUI.
 *
 * @kind function
 * @name dispatcher
 * @param {Object} action An object comprised of `type`, a string representing
 * the action received from the GUI and `visual` a boolean indicating if the
 * command came from the GUI or the menu.
 * @returns {null}
 */
const dispatcher = (action: {
  type: string,
  visual: boolean,
}): void => {
  // if the action is not visual, close the plugin after running
  const shouldTerminate: boolean = !action.visual;

  // load a Messenger instance for logging
  const messenger = new Messenger({ for: figma, in: figma.currentPage });

  // pass along some GUI management and navigation functions to the App class
  const app = new App({
    closeGUI,
    dispatcher,
    shouldTerminate,
    showGUI,
  });

  // run the action in the App class based on type
  switch (action.type) {
    case 'annotate':
      (async () => {
        try {
          // typefaces should be loaded before annotating with text
          await figma.loadFontAsync(TYPEFACES.primary);
          await app.annotateLayer();
        } catch (err) {
          messenger.log('Could not load typeface', 'error');
          console.log(err); // eslint-disable-line no-console
        }
      })();
      break;
    case 'annotate-custom':
      app.annotateLayerCustom();
      break;
    case 'bounding':
      app.drawBoundingBox();
      break;
    case 'measure':
      app.annotateMeasurement();
      break;
    default:
      showGUI();
  }

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
const main = (): void => {
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

/**
 * @description Listens for the command to close/shut down the plugin in a way that prevents
 * users from seeing unnecessary errors in the UI (recommended in the Figma docs).
 * [More info]{@link https://www.figma.com/plugin-docs/api/properties/figma-closeplugin//}
 *
 * @kind try...catch
 * @returns {null}
 * @throws {e} If the event is not the `CLOSE_PLUGIN_MSG`, it is thrown.
 */
// watch for close in a way that prevents unnecessary errors in the UI
try {
  main();
} catch (e) {
  if (e === CLOSE_PLUGIN_MSG) {
    figma.closePlugin();
  } else {
    // If we caught any other kind of exception,
    // it's a real error and should be passed along.
    throw e;
  }
}
