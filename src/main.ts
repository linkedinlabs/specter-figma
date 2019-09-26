// ++++++++++++++++++++++++++ Specter for Figma +++++++++++++++++++++++++++
import App from './App';
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
 * @param {booelan} suppress Attempt not to show users any lingering error messages.
 * Setting to `false` within `async` functions ensures the plugin actually closes.
 *
 * @throws {CLOSE_PLUGIN_MSG} Throws the command to close the plugin.
 */
const closeGUI = (suppress: boolean = true): void => {
  if (suppress) {
    // close the UI while suppressing error messages
    throw CLOSE_PLUGIN_MSG;
  }
  // close the UI without suppressing error messages
  return figma.closePlugin();
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

  // pass along some GUI management and navigation functions to the App class
  const app = new App({
    closeGUI,
    dispatcher,
    shouldTerminate,
    showGUI,
  });

  const runAction = (actionType: string) => {
    // run the action in the App class based on type
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
      case 'bounding':
        app.drawBoundingBox();
        break;
      case 'measure':
        app.annotateMeasurement();
        break;
      default:
        showGUI();
    }
  };

  const runActionWithTypefaces = async (actionType: string) => {
    // typefaces should be loaded before running action
    await figma.loadFontAsync(TYPEFACES.primary);
    await runAction(actionType);
  };
  runActionWithTypefaces(action.type);

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
} catch (err) {
  if (err === CLOSE_PLUGIN_MSG) {
    figma.closePlugin();
  } else {
    // If we caught any other kind of exception,
    // it's a real error and should be passed along.
    throw err;
  }
}
