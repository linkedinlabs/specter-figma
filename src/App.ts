import Crawler from './Crawler';
import Identifier from './Identifier';
import Messenger from './Messenger';
import Painter from './Painter';
import { DATA_KEYS } from './constants';

/**
 * @description A shared helper function to set up in-UI messages and the logger.
 *
 * @kind function
 * @name assemble
 * @param {Object} context The current context (event) received from Figma.
 * @returns {Object} Contains an object with the current page as a javascript object,
 * a messenger instance, and a selection array (if applicable).
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

/**
 * @description A class to handle core app logic and dispatch work to other classes.
 *
 * @class
 * @name App
 *
 * @constructor
 *
 * @property closeGUI A convenience function for closing the GUI and shutting down the plugin.
 * @property showGUI A convenience function for showing the GUI.
 * @property dispatcher The function from `main.ts` that determines where to route GUI clicks.
 * @property shouldTerminate A boolean that tells us whether or not the GUI should remain open
 * at the end of the plugin’s current task.
 */
export default class App {
  closeGUI: Function;
  dispatcher: Function;
  isMercadoMode: boolean;
  shouldTerminate: boolean;
  showGUI: Function;

  constructor({
    closeGUI,
    dispatcher,
    isMercadoMode,
    shouldTerminate,
    showGUI,
  }) {
    this.closeGUI = closeGUI;
    this.dispatcher = dispatcher;
    this.isMercadoMode = isMercadoMode;
    this.shouldTerminate = shouldTerminate;
    this.showGUI = showGUI;
  }

  /**
   * @description Identifies and annotates a selected layer or multiple layers in a Figma file.
   *
   * @kind function
   * @name annotateLayer
   *
   * @returns {null} Shows a Toast in the UI if nothing is selected.
   */
  annotateLayer() {
    const {
      messenger,
      page,
      selection,
    } = assemble(figma);

    let shouldTerminateLocal = this.shouldTerminate;

    // need a selected layer to annotate it
    if (selection === null || selection.length === 0) {
      messenger.log('Annotate layer: nothing selected');
      return messenger.toast('A layer must be selected');
    }

    // iterate through each layer in a selection
    const layers = new Crawler({ for: selection }).all();
    const multipleLayers = (layers.length > 1);

    layers.forEach((layer: BaseNode) => {
      // set up Identifier instance for the layer
      const layerToAnnotate = new Identifier({
        for: layer,
        data: page,
        dispatcher: this.dispatcher,
        isMercadoMode: this.isMercadoMode,
        messenger,
      });

      // set up Painter instance for the layer
      const painter = new Painter({
        for: layer,
        in: page,
        isMercadoMode: this.isMercadoMode,
      });

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

      // ---------- determine the annotation text
      let hasText = false;

      // check first for custom text
      const hasCustomTextResult = layerToAnnotate.hasCustomText();

      if (hasCustomTextResult.status === 'error') {
        // find the name from a design library component, effect, or style
        const getLibraryNameResult = layerToAnnotate.getLibraryName();
        messenger.handleResult(getLibraryNameResult);

        if (getLibraryNameResult.status === 'error') {
          if (!multipleLayers) {
            // show the GUI if we are annotating a single custom layer
            if (shouldTerminateLocal) {
              shouldTerminateLocal = false;
              this.showGUI(this.isMercadoMode);
            }

            // present the option to set custom text
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

              // close the GUI if it started closed
              if (this.shouldTerminate && !shouldTerminateLocal) {
                this.closeGUI();
              }
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

    if (shouldTerminateLocal) {
      this.closeGUI();
    }
    return null;
  }

  /**
   * @description Annotates a selected layer in a Figma file with user input.
   *
   * @kind function
   * @name annotateLayerCustom
   *
   * @returns {null} Shows a Toast in the UI if nothing is selected or if multiple layers
   * are selected.
   */
  annotateLayerCustom() {
    const {
      messenger,
      page,
      selection,
    } = assemble(figma);

    // need a selected layer to annotate it
    if (selection === null || selection.length === 0) {
      return messenger.toast('A layer must be selected');
    }

    // need a single selected layer to annotate it
    if (selection.length > 1) {
      return messenger.toast('Only one layer may be selected');
    }

    if (this.shouldTerminate) {
      this.showGUI(this.isMercadoMode);
    }

    // grab the layer form the selection
    const layer = new Crawler({ for: selection }).first();

    // set up Identifier instance for the layer
    const layerToAnnotate = new Identifier({
      for: layer,
      data: page,
      dispatcher: this.dispatcher,
      isMercadoMode: this.isMercadoMode,
      messenger,
      shouldTerminate: this.shouldTerminate,
    });

    // set up Painter instance for the layer
    const painter = new Painter({
      for: layer,
      in: page,
      isMercadoMode: this.isMercadoMode,
    });

    // determine the annotation text
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
        // draw the annotation
        let paintResult = null;
        paintResult = painter.addAnnotation();

        // read the response from Painter; if it was unsuccessful, log and display the error
        if (paintResult && (paintResult.status === 'error')) {
          return messenger.handleResult(paintResult);
        }
      }

      if (this.shouldTerminate) {
        this.closeGUI();
      }

      return null;
    };

    // set the custom text
    setText(handleSetTextResult);
    return null;
  }

  /**
   * @description If two layers are selected: annotates the selection with the
   * spacing number (“IS-X”) based on either the gap between the two layers or, if they
   * are overlapping, the 4 directions of overlap (top, bottom, right, and left). If
   * one layer is selected: annotates the height and width of the selected layer
   * in “dp” (digital points) units.
   *
   * @kind function
   * @name annotateMeasurement
   *
   * @returns {null} Shows a Toast in the UI if nothing is selected or
   * if more than two layers are selected.
   */
  annotateMeasurement() {
    const {
      messenger,
      page,
      selection,
    } = assemble(figma);
    // need one or two selected layers
    if (selection === null || selection.length === 0 || selection.length > 2) {
      messenger.log(`Annotate measurement: ${selection.length} layer(s) selected`);
      return messenger.toast('One or two layers must be selected');
    }

    // grab the gap position from the selection
    const crawler = new Crawler({ for: selection });
    const layer = crawler.first();

    // set up Painter instance for the reference layer
    const painter = new Painter({
      for: layer,
      in: page,
      isMercadoMode: this.isMercadoMode,
    });

    // draw the spacing annotation
    // (if gap position exists or layers are overlapped)
    let paintResult = null;
    if (selection.length === 2) {
      const gapPositionResult = crawler.gapPosition();

      // read the response from Crawler; log and display message(s)
      messenger.handleResult(gapPositionResult);
      if (gapPositionResult.status === 'success' && gapPositionResult.payload) {
        const gapPosition = gapPositionResult.payload;
        paintResult = painter.addGapMeasurement(gapPosition);
      } else {
        const overlapPositionsResult = crawler.overlapPositions();

        // read the response from Crawler; log and display message(s)
        messenger.handleResult(overlapPositionsResult);

        if (overlapPositionsResult.status === 'success' && overlapPositionsResult.payload) {
          const overlapPositions = overlapPositionsResult.payload;
          paintResult = painter.addOverlapMeasurements(overlapPositions);
        }
      }
    }

    if (selection.length === 1) {
      paintResult = painter.addDimMeasurement();
    }

    // read the response from Painter; log and display message(s)
    if (paintResult) {
      messenger.handleResult(paintResult);
    }

    if (this.shouldTerminate) {
      this.closeGUI();
    }
    return null;
  }

  /**
   * @description Annotates the selection with the spacing number (“IS-X”) based on either
   * the gap between the two layers or, if they are overlapping, the 4 directions of overlap
   * (top, bottom, right, and left).
   *
   * @kind function
   * @name annotateSpacingOnly
   * @param {string} direction An optional string representing the annotation direction.
   * Valid inputs are `top`, `bottom`, `right` (default), and `left`.
   * @returns {null} Shows a Toast in the UI if nothing is selected or
   * if more than two layers are selected.
   */
  annotateSpacingOnly(direction: 'top' | 'bottom' | 'left' | 'right' = 'right') {
    const {
      messenger,
      page,
      selection,
    } = assemble(figma);

    // need a selected layer to annotate it
    if (selection === null || selection.length !== 2) {
      return messenger.toast('Two layers must be selected');
    }

    // grab the gap position from the selection
    const crawler = new Crawler({ for: selection });
    const layer = crawler.first();

    // set up Painter instance for the reference layer
    const painter = new Painter({
      for: layer,
      in: page,
      isMercadoMode: this.isMercadoMode,
    });

    // draw the spacing annotation
    // (if gap position exists or layers are overlapped)
    let paintResult = null;
    if (selection.length === 2) {
      const overlapPositionsResult = crawler.overlapPositions();

      // read the response from Crawler; log and display message(s)
      messenger.handleResult(overlapPositionsResult);

      if (overlapPositionsResult.status === 'success' && overlapPositionsResult.payload) {
        const overlapPositions = overlapPositionsResult.payload;
        if (overlapPositions) {
          const directions = [direction];
          paintResult = painter.addOverlapMeasurements(overlapPositions, directions);

          // read the response from Painter; log and display message(s)
          messenger.handleResult(paintResult);
        } else {
          messenger.toast('The selected layers need to overlap');
        }
      } else {
        messenger.toast('The selected layers need to overlap');
      }
    }

    if (this.shouldTerminate) {
      this.closeGUI();
    }
    return null;
  }

  /**
   * @description Annotates the selection with the spacing number (“IS-X”) based on the
   * surrounding padding (top, bottom, right, and left). The selection must be a
   * node with auto-layout enabled.
   *
   * @kind function
   * @name annotateSpacingALPadding
   *
   * @returns {null} Shows a Toast in the UI if nothing is selected, if more than one node
   * is selected, or if the wrong type of node is selected.
   */
  annotateSpacingALPadding() {
    const {
      messenger,
      page,
      selection,
    } = assemble(figma);

    // need a selected layer to annotate it
    if (selection === null || selection.length > 1) {
      return messenger.toast('One layer must be selected');
    }

    // grab the gap position from the selection
    const crawler = new Crawler({ for: selection });
    const layer = crawler.first();

    // need a node with auto-layout to annotate it
    if (layer.type !== 'FRAME' || (layer.type === 'FRAME' && layer.layoutMode === 'NONE')) {
      return messenger.toast('A layer with auto-layout enabled must be selected');
    }

    // set up Painter instance for the reference layer
    const painter = new Painter({
      for: layer,
      in: page,
      isMercadoMode: this.isMercadoMode,
    });

    // draw the spacing annotations based on auto-layout padding settings
    let paintResult = null;
    const paddingPositionsResult = crawler.paddingPositions();

    // read the response from Crawler; log and display message(s)
    messenger.handleResult(paddingPositionsResult);

    if (paddingPositionsResult.status === 'success' && paddingPositionsResult.payload) {
      const paddingPositions = paddingPositionsResult.payload;
      if (paddingPositions) {
        paintResult = painter.addOverlapMeasurements(paddingPositions);

        // read the response from Painter; log and display message(s)
        messenger.handleResult(paintResult);
      } else {
        messenger.toast('The selected layers need to overlap');
      }
    } else {
      messenger.toast('The selected layers need to overlap');
    }

    if (this.shouldTerminate) {
      this.closeGUI();
    }
    return null;
  }

  /**
   * @description Draws semi-transparent “Bounding Box(es)” around any selected nodes.
   * The `type` parameter determines if a single box is drawn, incorporating all selected
   * nodes (`single`), or if a box is drawn around each individual node (`multiple`).
   *
   * @kind function
   * @name drawBoundingBoxes
   *
   * @param {string} type Use `single` for a box around the entire selection or `multiple`
   * for individual boxes around each selected node.
   *
   * @returns {null} Shows a Toast in the UI if nothing is selected.
   */
  drawBoundingBoxes(type: 'single' | 'multiple' = 'single') {
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

    const drawSingleBox = (nodes) => {
      // grab the position from the selection
      const crawler = new Crawler({ for: nodes });

      const layer = crawler.first();
      const positionResult = crawler.position();

      // read the response from Crawler; log and display message(s)
      messenger.handleResult(positionResult);

      if (positionResult.status === 'success' && positionResult.payload) {
        const position = positionResult.payload;
        const painter = new Painter({
          for: layer,
          in: page,
          isMercadoMode: this.isMercadoMode,
        });

        // draw the bounding box (if position exists)
        let paintResult = null;
        if (position) {
          paintResult = painter.addBoundingBox(position);
        }

        // read the response from Painter; log and display message(s)
        messenger.handleResult(paintResult);
      }
    };

    // set individual boxes for each selected node or set a single box
    // that covers all nodes in the selection
    if (type === 'multiple') {
      selection.forEach((node: SceneNode) => {
        drawSingleBox([node]); // expects an array
      });
    } else {
      drawSingleBox(selection);
    }

    if (this.shouldTerminate) {
      this.closeGUI();
    }
    return null;
  }

  /** WIP
   * @description Draws semi-transparent “Bounding Box(es)” around any selected nodes.
   * The `type` parameter determines if a single box is drawn, incorporating all selected
   * nodes (`single`), or if a box is drawn around each individual node (`multiple`).
   *
   * @kind function
   * @name toggleMercadoMode
   *
   * @param {string} type Use `single` for a box around the entire selection or `multiple`
   * for individual boxes around each selected node.
   *
   * @returns {null} Shows a Toast in the UI if nothing is selected.
   */
  static async toggleMercadoMode() {
    // retrieve existing options
    const lastUsedOptions: {
      isMercadoMode: boolean,
    } = await figma.clientStorage.getAsync(DATA_KEYS.options);

    // set preliminary mercado mode
    let currentIsMercadoMode: boolean = false;
    if (lastUsedOptions && lastUsedOptions.isMercadoMode !== undefined) {
      currentIsMercadoMode = lastUsedOptions.isMercadoMode;
    }

    // set new mercado mode flag
    const options: {
      isMercadoMode: boolean
    } = {
      isMercadoMode: !currentIsMercadoMode,
    };

    // save new options to storage
    await figma.clientStorage.setAsync(DATA_KEYS.options, options);
  }
}
