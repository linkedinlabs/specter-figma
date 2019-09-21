// ++++++++++++++++++++++++++ Specter for Figma +++++++++++++++++++++++++++
import Crawler from './Crawler';
import Identifier from './Identifier';
import Messenger from './Messenger';
import Painter from './Painter';
import {
  CLOSE_PLUGIN_MSG,
  GUI_SETTINGS,
  TYPEFACES,
} from './constants';

/**
 * @description A shared helper function to set up in-UI messages and the logger.
 *
 * @kind function
 * @name assemble
 * @param {Object} context The current context (event) received from Sketch.
 * @returns {Object} Contains an object with the current document as a javascript object,
 * a JSON object with documentData, a messenger instance, and a selection array (if applicable).
 */
const assemble = (context: any = null) => {
  const page = context.currentPage;
  const { selection } = context.currentPage;
  const messenger = new Messenger({ for: context, in: page });

  return {
    messenger,
    page,
    selection,
  };
};

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
  const {
    messenger,
    page,
    selection,
  } = assemble(figma);

  // need a selected layer to annotate it
  if (selection === null || selection.length === 0) {
    messenger.log('Annotate layer: nothing selected');
    return messenger.toast('A layer must be selected');
  }

  // iterate through each layer in a selection
  const layers = new Crawler({ for: selection }).all();
  const multipleLayers = (layers.length > 1);

  layers.forEach((layer) => {
    // set up Identifier instance for the layer
    const layerToAnnotate = new Identifier({
      for: layer,
      data: page,
      messenger,
    });

    // set up Painter instance for the layer
    const painter = new Painter({ for: layer, in: page });

    // set up function to draw annotations
    const drawAnnotation = (hasText: boolean) => {
      // draw the annotation (if the text exists)
      let paintResult = null;
      if (hasText) {
        paintResult = painter.addAnnotation();
      }

      // read the response from Painter; if it was unsuccessful, log and display the error
      if (paintResult && (paintResult.status === 'error')) {
        return messenger.handleResult(paintResult);
      }

      return null;
    };

    // determine the annotation text
    let hasText = false;
    const hasCustomTextResult = layerToAnnotate.hasCustomText();

    if (hasCustomTextResult.status === 'error') {
      const getLibraryNameResult = layerToAnnotate.getLibraryName();
      messenger.handleResult(getLibraryNameResult);

      if (getLibraryNameResult.status === 'error') {
        if (!multipleLayers) {
          const setText = (callback: Function) => layerToAnnotate.setText(callback);
          const handleSetTextResult = (setTextResult: {
            status: 'error' | 'success',
            messages: {
              toast: string,
              log: string,
            },
          }) => {
            messenger.handleResult(setTextResult);

            if (setTextResult.status === 'success') {
              hasText = true;
            }

            // draw the annotation
            drawAnnotation(hasText);
          };

          // set the custom text
          setText(handleSetTextResult);
        }
      } else {
        hasText = true;

        // draw the annotation
        drawAnnotation(hasText);
      }
    } else {
      hasText = true;

      // draw the annotation
      drawAnnotation(hasText);
    }
    return null;
  });

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
  console.log('action: annotateLayerCustom'); // eslint-disable-line no-console

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
  console.log('action: annotateMeasurement'); // eslint-disable-line no-console

  if (shouldTerminate) {
    closeGUI();
  }
  return null;
};

/**
 * @description Draws a semi-transparent “Bounding Box” around any selected elements.
 *
 * @kind function
 * @name drawBoundingBox
 *
 * @param {boolean} shouldTerminate Whether or not to close the plugin at the end of the action.
 * @returns {null} Shows a Toast in the UI if nothing is selected.
 */
const drawBoundingBox = (shouldTerminate: boolean = true): void => {
  const {
    messenger,
    page,
    selection,
  } = assemble(figma);

  // need a selected layer to annotate it
  if (selection === null || selection.length === 0) {
    messenger.log('Draw bounding box: nothing selected');
    return messenger.toast('At least one layer must be selected');
  }

  // grab the frame from the selection
  const crawler = new Crawler({ for: selection });
  const layer = crawler.first();
  const position = crawler.position();
  const painter = new Painter({ for: layer, in: page });

  // draw the bounding box (if position exists)
  let paintResult = null;
  if (position) {
    paintResult = painter.addBoundingBox(position);
  }

  // read the response from Painter; log and display message(s)
  messenger.handleResult(paintResult);

  if (shouldTerminate) {
    closeGUI();
  }
  return null;
};

// watch for commands -------------------------------------------------

/** WIP
 * @description Takes a unique string (`type`) and calls the corresponding action.
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
  const { messenger } = assemble(figma);

  // if the action is not visual, close the plugin after running
  const shouldTerminate: boolean = !action.visual;

  // run the action based on type
  switch (action.type) {
    case 'annotate':
      (async () => {
        try {
          await figma.loadFontAsync(TYPEFACES.primary);
          await annotateLayer(shouldTerminate);
        } catch (err) {
          messenger.log('Could not load typeface', 'error');
          console.log(err); // eslint-disable-line no-console
        }
      })();
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
    dispatch({
      type: figma.command,
      visual: false,
    });
  }

  // watch GUI action clicks -------------------------------------------------
  figma.ui.onmessage = (msg: { navType: string }): void => {
    if (msg.navType) {
      dispatch({
        type: msg.navType,
        visual: true,
      });
    }

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
