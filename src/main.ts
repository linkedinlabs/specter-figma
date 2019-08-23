// ++++++++++++++++++++++++++ Specter for Figma +++++++++++++++++++++++++++
import { CLOSE_PLUGIN_MSG, GUI_SETTINGS } from './constants';

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

// invoked commands -------------------------------------------------

/** WIP
 * @description Identifies and annotates a selected layer in a Sketch file.
 *
 * @kind function
 * @name annotateLayer
 *
 * @param {Object} context The current context (event) received from Sketch.
 * @returns {null} Shows a Toast in the UI if nothing is selected.
 */
const annotateLayer = (shouldTerminate: boolean): void => {
  console.log('action: annotateLayer');

  if (shouldTerminate) {
    closeGUI();
  }
  return null;
};

/** WIP
 * @description Annotates a selected layer in a Sketch file with user input.
 *
 * @kind function
 * @name annotateLayerCustom
 *
 * @param {Object} context The current context (event) received from Sketch.
 * @returns {null} Shows a Toast in the UI if nothing is selected or
 * if multiple layers are selected.
 */
const annotateLayerCustom = (shouldGloseGUI: boolean): void => {
  console.log('action: annotateLayerCustom');

  if (shouldGloseGUI) {
    closeGUI();
  }
  return null;
};

/** WIP
 * @description Annotates a selection of layers in a Sketch file with the
 * spacing number (“IS-X”) based on the gap between the two layers.
 *
 * @kind function
 * @name annotateMeasurement
 *
 * @param {Object} context The current context (event) received from Sketch.
 * @returns {null} Shows a Toast in the UI if nothing is selected or
 * if more than two layers are selected.
 */
const annotateMeasurement = (shouldTerminate: boolean): void => {
  console.log('action: annotateMeasurement');

  if (shouldTerminate) {
    closeGUI();
  }
  return null;
};

/** WIP
 * @description Draws a semi-transparent “Bounding Box” around any selected elements.
 *
 * @kind function
 * @name drawBoundingBox
 *
 * @param {Object} context The current context (event) received from Sketch.
 * @returns {null} Shows a Toast in the UI if nothing is selected.
 */
const drawBoundingBox = (shouldTerminate: boolean = true): void => {
  console.log('action: drawBoundingBox');

  if (shouldTerminate) {
    closeGUI();
  }
  return null;
};

// watch for commands -------------------------------------------------

/**
 * @description Identifies and annotates a selected layer in a Sketch file.
 *
 * @kind function
 * @name dispatch
 * @param {object} action An object comprised of `type`, a string representing
 * the action received from the GUI and `visual` a boolean indicating if the
 * command came from the GUI or the menu.
 * @returns {null}
 */
const dispatch = (action: {
  type: string,
  visual: boolean,
}): void => {
  // if the action is not visual, close the plugin after running
  const shouldTerminate: boolean = !action.visual;

  // run the action based on type
  switch (action.type) {
    case 'annotate':
      annotateLayer(shouldTerminate);
      break;
    case 'annotate-custom':
      annotateLayerCustom(shouldTerminate);
      break;
    case 'bounding':
      drawBoundingBox(shouldTerminate);
      break;
    case 'measure':
      annotateMeasurement(shouldTerminate);
      break;
    default:
      showGUI();
  }

  return null;
};

/**
 * @description Acts as the main wrapper function for the plugin, run by default
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
    dispatch({
      type: figma.command,
      visual: false,
    });
  }

  // watch GUI action clicks -------------------------------------------------
  figma.ui.onmessage = (msg: { type: string }): void => {
    if (msg.type) {
      dispatch({
        type: msg.type,
        visual: true,
      });
    }

    return null;
  };
};

/**
 * @description Listens for the command to close/shut-down the plugin in a way that prevents
 * users from seeing unnecessary errors in the UI (recommended in the Figma docs).
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
