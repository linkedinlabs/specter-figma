import Crawler from './Crawler';
import Identifier from './Identifier';
import Messenger from './Messenger';
import Painter from './Painter';

/**
 * @description A shared helper function to set up in-UI messages and the logger.
 *
 * @kind function
 * @name assemble
 * @param {Object} context The current context (event) received from Figma.
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

/** WIP
 * @description A class to handle UI alerts, messages, and logging.
 *
 * @class
 * @name App
 *
 * @constructor
 *
 * @property event The encompassing event we are logging or applying a message/alert to.
 * @property page The Figma file that will display messages/alerts
 * or that the log will reference.
 */
export default class App {
  closeGUI: Function;
  dispatcher: Function;
  shouldTerminate: boolean;
  showGUI: Function;

  constructor({
    closeGUI,
    dispatcher,
    shouldTerminate,
    showGUI,
  }) {
    this.closeGUI = closeGUI;
    this.dispatcher = dispatcher;
    this.shouldTerminate = shouldTerminate;
    this.showGUI = showGUI;
  }

  /** WIP
   * @description Identifies and annotates a selected layer in a Figma file.
   *
   * @kind function
   * @name annotateLayer
   *
   * @param {Object} context The current context (event) received from Figma.
   * @returns {null} Shows a Toast in the UI if nothing is selected.
   */
  annotateLayer() {
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
        dispatcher: this.dispatcher,
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

    if (this.shouldTerminate) {
      this.closeGUI();
    }
    return null;
  }

  /** WIP
   * @description Annotates a selected layer in a Figma file with user input.
   *
   * @kind function
   * @name annotateLayerCustom
   *
   * @param {Object} context The current context (event) received from Figma.
   * @returns {null} Shows a Toast in the UI if nothing is selected or
   * if multiple layers are selected.
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

    // need a selected layer to annotate it
    if (selection.length > 1) {
      return messenger.toast('Only one layer may be selected');
    }

    if (this.shouldTerminate) {
      this.showGUI();
    }

    // grab the layer form the selection
    const layer = new Crawler({ for: selection }).first();

    // set up Identifier instance for the layer
    const layerToAnnotate = new Identifier({
      for: layer,
      data: page,
      messenger,
      dispatcher: this.dispatcher,
    });

    // set up Painter instance for the layer
    const painter = new Painter({ for: layer, in: document });

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

      return null;
    };

    // set the custom text
    setText(handleSetTextResult);

    if (this.shouldTerminate) {
      this.closeGUI();
    }
    return null;
  }

  /** WIP
   * @description Annotates a selection of layers in a Figma file with the
   * spacing number (“IS-X”) based on the gap between the two layers.
   *
   * @kind function
   * @name annotateMeasurement
   *
   * @param {Object} context The current context (event) received from Figma.
   * @returns {null} Shows a Toast in the UI if nothing is selected or
   * if more than two layers are selected.
   */
  annotateMeasurement() {
    console.log('action: annotateMeasurement'); // eslint-disable-line no-console

    if (this.shouldTerminate) {
      this.closeGUI();
    }
    return null;
  }

  /**
   * @description Draws a semi-transparent “Bounding Box” around any selected elements.
   *
   * @kind function
   * @name drawBoundingBox
   *
   * @param {boolean} shouldTerminate Whether or not to close the plugin at the end of the action.
   * @returns {null} Shows a Toast in the UI if nothing is selected.
   */
  drawBoundingBox() {
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

    if (this.shouldTerminate) {
      this.closeGUI();
    }
    return null;
  }
}
