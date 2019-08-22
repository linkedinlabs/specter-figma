// ++++++++++++++++++++++++++ Specter for Figma +++++++++++++++++++++++++++
import { GUI_SETTINGS } from './constants';

// GUI management -------------------------------------------------
/**
 * @description Enables the plugin GUI within Figma.
 *
 * @kind function
 * @name closeGUI
 *
 * @returns {null} Shows a Toast in the UI if nothing is selected.
 */
const closeGUI = (): void => {
  // close the UI
  figma.closePlugin();
  return;
}

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
}

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
}

const main = (): void => {
  // watch menu commands -------------------------------------------------
  if (figma.command) {
    dispatch({
      type: figma.command,
      visual: false,
    });
  }

  // watch GUI action clicks -------------------------------------------------
  figma.ui.onmessage = (msg): void => {
    if (msg.type) {
      dispatch({
        type: msg.type,
        visual: true,
      });
    }

    return null;
  };
}
main();
