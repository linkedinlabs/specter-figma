import Crawler from './Crawler';
import Identifier from './Identifier';
import Messenger from './Messenger';
import Painter from './Painter';
import { DATA_KEYS, GUI_SETTINGS } from './constants';

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
   * @description Matches corner radius of a node (or inner-child node) with a matrix
   * of tokens from Mercado that represent the corner radii. An annotation is drawn
   * with the matching token.
   *
   * @kind function
   * @name annotateCorners
   *
   * @returns {null} Shows a Toast in the UI if nothing is selected.
   */
  annotateCorners() {
    const {
      messenger,
      page,
      selection,
    } = assemble(figma);
    // need one or two selected nodes
    if (selection === null || selection.length === 0) {
      messenger.log(`Annotate corners: ${selection.length} node(s) selected`);
      return messenger.toast('At least one layer must be selected');
    }

    // set up selection array
    const crawler = new Crawler({ for: selection });
    const flattenedNodes = crawler.all();

    // combine direct selection with flattened selection
    // (gives us both Frames and inner content)
    const combinedNodesArray = selection.concat(flattenedNodes);

    // ensure no nodes are repeated
    const nodes = [...new Set(combinedNodesArray)];

    // set initial flag
    let applicableNodes = false;

    // iterate direct selection and annotate corners
    nodes.forEach((node: SceneNode) => {
      // check that the node is the correct type
      if (
        (node.type === 'FRAME')
        || (node.type === 'RECTANGLE')
      ) {
        const shapeNode = node as FrameNode | RectangleNode;

        // check that the node has a single value for `cornerRadius`
        if (
          (shapeNode.topLeftRadius > 0)
          && (shapeNode.topRightRadius > 0)
          && (shapeNode.bottomLeftRadius > 0)
          && (shapeNode.bottomRightRadius > 0)
        ) {
          // set up Identifier instance for the node
          const nodeToAnnotate = new Identifier({
            for: node,
            data: page,
            dispatcher: this.dispatcher,
            isMercadoMode: this.isMercadoMode,
            messenger,
          });

          // set up Painter instance for the node
          const painter = new Painter({
            for: node,
            in: page,
            isMercadoMode: this.isMercadoMode,
          });

          // retrieve corner token and set to node
          const getCornerTokenResult = nodeToAnnotate.getCornerToken();
          messenger.handleResult(getCornerTokenResult);

          if (getCornerTokenResult.status === 'success') {
            // add the annotation
            const paintResult = painter.addAnnotation();
            if (paintResult) {
              messenger.handleResult(paintResult);
            }
          }

          // set selection feedback flag
          applicableNodes = true;
        }
      }
    });

    if (!applicableNodes) {
      messenger.log('Annotate corners: No nodes have matching corners');
      return messenger.toast('At least one layer with matching corners must be selected');
    }

    if (this.shouldTerminate) {
      this.closeGUI();
    }
    return null;
  }

  /**
   * @description Identifies and annotates a selected node or multiple nodes in a Figma file.
   *
   * @kind function
   * @name annotateNode
   *
   * @returns {null} Shows a Toast in the UI if nothing is selected.
   */
  annotateNode() {
    const {
      messenger,
      page,
      selection,
    } = assemble(figma);

    let shouldTerminateLocal = this.shouldTerminate;

    // need a selected node to annotate it
    if (selection === null || selection.length === 0) {
      messenger.log('Annotate node: nothing selected');
      return messenger.toast('A layer must be selected');
    }

    // iterate through each node in a selection
    const nodes = new Crawler({ for: selection }).all();
    const multipleNodes = (nodes.length > 1);

    nodes.forEach((node: BaseNode) => {
      // set up Identifier instance for the node
      const nodeToAnnotate = new Identifier({
        for: node,
        data: page,
        dispatcher: this.dispatcher,
        isMercadoMode: this.isMercadoMode,
        messenger,
      });

      // set up Painter instance for the node
      const painter = new Painter({
        for: node,
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
      const hasCustomTextResult = nodeToAnnotate.hasCustomText();

      if (hasCustomTextResult.status === 'error') {
        // find the name from a design library component, effect, or style
        const getLibraryNameResult = nodeToAnnotate.getLibraryName();
        messenger.handleResult(getLibraryNameResult);

        if (getLibraryNameResult.status === 'error') {
          if (!multipleNodes) {
            // show the GUI if we are annotating a single custom node
            if (shouldTerminateLocal) {
              shouldTerminateLocal = false;
              this.showGUI(this.isMercadoMode);
            }

            // present the option to set custom text
            const setText = (callback: Function) => nodeToAnnotate.setText(callback);
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
   * @description Annotates a selected node in a Figma file with user input.
   *
   * @kind function
   * @name annotateNodeCustom
   *
   * @returns {null} Shows a Toast in the UI if nothing is selected or if multiple nodes
   * are selected.
   */
  annotateNodeCustom() {
    const {
      messenger,
      page,
      selection,
    } = assemble(figma);

    // need a selected node to annotate it
    if (selection === null || selection.length === 0) {
      return messenger.toast('A layer must be selected');
    }

    // need a single selected node to annotate it
    if (selection.length > 1) {
      return messenger.toast('Only one layer may be selected');
    }

    if (this.shouldTerminate) {
      this.showGUI(this.isMercadoMode);
    }

    // grab the node form the selection
    const node = new Crawler({ for: selection }).first();

    // set up Identifier instance for the node
    const nodeToAnnotate = new Identifier({
      for: node,
      data: page,
      dispatcher: this.dispatcher,
      isMercadoMode: this.isMercadoMode,
      messenger,
      shouldTerminate: this.shouldTerminate,
    });

    // set up Painter instance for the node
    const painter = new Painter({
      for: node,
      in: page,
      isMercadoMode: this.isMercadoMode,
    });

    // determine the annotation text
    const setText = (callback: Function) => nodeToAnnotate.setText(callback);
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
   * @description If two nodes are selected: annotates the selection with the
   * spacing token (“IS-X”) based on either the gap between the two nodes or, if they
   * are overlapping, the 4 directions of overlap (top, bottom, right, and left). If
   * one node is selected: annotates the height and width of the selected node
   * in “dp” (digital points) units.
   *
   * @kind function
   * @name annotateMeasurement
   *
   * @returns {null} Shows a Toast in the UI if nothing is selected or
   * if more than two nodes are selected.
   */
  annotateMeasurement() {
    const {
      messenger,
      page,
      selection,
    } = assemble(figma);
    // need one or two selected nodes
    if (selection === null || selection.length === 0 || selection.length > 2) {
      messenger.log(`Annotate measurement: ${selection.length} node(s) selected`);
      return messenger.toast('One or two layers must be selected');
    }

    // grab the gap position from the selection
    const crawler = new Crawler({ for: selection });
    const node = crawler.first();

    // set up Painter instance for the reference node
    const painter = new Painter({
      for: node,
      in: page,
      isMercadoMode: this.isMercadoMode,
    });

    // draw the spacing annotation
    // (if gap position exists or nodes are overlapped)
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
   * @description Annotates the selection with the spacing token (“IS-X”) based on either
   * the gap between the two nodes or, if they are overlapping, the 4 directions of overlap
   * (top, bottom, right, and left).
   *
   * @kind function
   * @name annotateSpacingOnly
   * @param {string} direction An optional string representing the annotation direction.
   * Valid inputs are `top`, `bottom`, `right` (default), and `left`.
   * @returns {null} Shows a Toast in the UI if nothing is selected or
   * if more than two nodes are selected.
   */
  annotateSpacingOnly(direction: 'top' | 'bottom' | 'left' | 'right' = 'right') {
    const {
      messenger,
      page,
      selection,
    } = assemble(figma);

    // need a selected node to annotate it
    if (selection === null || selection.length !== 2) {
      return messenger.toast('Two layers must be selected');
    }

    // grab the gap position from the selection
    const crawler = new Crawler({ for: selection });
    const node = crawler.first();

    // set up Painter instance for the reference node
    const painter = new Painter({
      for: node,
      in: page,
      isMercadoMode: this.isMercadoMode,
    });

    // draw the spacing annotation
    // (if gap position exists or nodes are overlapped)
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
   * @description Annotates the selection with the spacing token (“IS-X”) based on the
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

    // need a selected node to annotate it
    if (selection === null || selection.length > 1) {
      return messenger.toast('One layer must be selected');
    }

    // grab the gap position from the selection
    const crawler = new Crawler({ for: selection });
    const node = crawler.first();

    // need a node with auto-layout to annotate it
    if (node.type !== 'FRAME' || (node.type === 'FRAME' && node.layoutMode === 'NONE')) {
      return messenger.toast('A layer with auto-layout enabled must be selected');
    }

    // set up Painter instance for the reference node
    const painter = new Painter({
      for: node,
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

    // need a selected node to annotate it
    if (selection === null || selection.length === 0) {
      messenger.log('Draw bounding box: nothing selected');
      return messenger.toast('At least one layer must be selected');
    }

    const drawSingleBox = (nodes) => {
      // grab the position from the selection
      const crawler = new Crawler({ for: nodes });

      const node = crawler.first();
      const positionResult = crawler.position();

      // read the response from Crawler; log and display message(s)
      messenger.handleResult(positionResult);

      if (positionResult.status === 'success' && positionResult.payload) {
        const position = positionResult.payload;
        const painter = new Painter({
          for: node,
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
   * @description Enables/disables a feature-flag (`isMercadoMode`) used to expose
   * features specific to the Mercado Design Library. The flag is saved to local
   * storage so that it persists across files.
   *
   * @kind function
   * @name toggleMercadoMode
   *
   * @returns {Promise} Returns a promise for resolution.
   */
  static async refreshGUI() {
    const { messenger, selection } = assemble(figma);

    // set up initial selection
    // tktk
    const nodes: Array<SceneNode> = new Crawler({ for: selection }).all();

    // get last-used filters from options
    const lastUsedOptions: PluginOptions = await figma.clientStorage.getAsync(DATA_KEYS.options);
    const { currentView, isMercadoMode } = lastUsedOptions;

    // resize the UI based on selection
    // tktk

    // send the updates to the UI
    figma.ui.postMessage({
      action: 'refreshState',
      payload: {
        currentView,
        isMercadoMode,
        selection,
        // sessionKey,
        // guiStartSize: newGUIHeight,
      },
    });

    // figma.ui.resize(
    //   GUI_SETTINGS.default.width,
    //   newGUIHeight,
    // );

    messenger.log(`Updating the UI with ${nodes.length} selected ${nodes.length === 1 ? 'node' : 'nodes'}`);
  }


  /** WIP
   * @description Triggers a UI refresh with the current selection.
   *
   * @kind function
   * @name resizeGUI
   *
   * @param {string} sessionKey A rotating key used during the single run of the plugin.
   */
  static async resizeGUI(
    payload: { bodyHeight: number },
  ) {
    const { bodyHeight } = payload;
    const newGUIHeight = bodyHeight + 40; // add floating footer height

    if (bodyHeight) {
      figma.ui.resize(
        GUI_SETTINGS.default.width,
        newGUIHeight,
      );
    }
  }

  /** WIP
   * @description Enables/disables a feature-flag (`isMercadoMode`) used to expose
   * features specific to the Mercado Design Library. The flag is saved to local
   * storage so that it persists across files.
   *
   * @kind function
   * @name toggleMercadoMode
   *
   * @returns {Promise} Returns a promise for resolution.
   */
  static async setViewContext(payload) {
    const { newView }: {
      newView: 'general' | 'a11y-keyboard' | 'a11y-labels' | 'a11y-headings'
    } = payload;

    // retrieve existing options
    let options: any = {};
    const lastUsedOptions = await figma.clientStorage.getAsync(DATA_KEYS.options);
    if (lastUsedOptions !== undefined) {
      options = lastUsedOptions;
    }

    // set new view without changing other options
    options.currentView = newView;

    // save new options to storage
    await figma.clientStorage.setAsync(DATA_KEYS.options, options);

    // App.refreshGUI(sessionKey);
    App.refreshGUI();
  }

  /**
   * @description Enables/disables a feature-flag (`isMercadoMode`) used to expose
   * features specific to the Mercado Design Library. The flag is saved to local
   * storage so that it persists across files.
   *
   * @kind function
   * @name toggleMercadoMode
   *
   * @returns {Promise} Returns a promise for resolution.
   */
  static async toggleMercadoMode() {
    // retrieve existing options
    let options: any = {};
    const lastUsedOptions = await figma.clientStorage.getAsync(DATA_KEYS.options);

    if (lastUsedOptions) {
      options = lastUsedOptions;
    }

    // set preliminary mercado mode
    let currentIsMercadoMode: boolean = false;
    if (options && options.isMercadoMode !== undefined) {
      currentIsMercadoMode = options.isMercadoMode;
    }

    // set new mercado mode flag without changing other options
    options.isMercadoMode = !currentIsMercadoMode;

    // save new options to storage
    await figma.clientStorage.setAsync(DATA_KEYS.options, options);
  }
}
