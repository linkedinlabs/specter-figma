import Crawler from './Crawler';
import Identifier from './Identifier';
import Messenger from './Messenger';
import Painter from './Painter';
import { existsInArray, updateArray } from './Tools';
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

/** WIP
 * @description A shared helper function to set up in-UI messages and the logger.
 *
 * @kind function
 * @name cleanupAnnotations
 * @param {Object} context The current context (event) received from Figma.
 * @returns {Object} Contains an object with the current page as a javascript object,
 * a messenger instance, and a selection array (if applicable).
 */
const cleanupAnnotations = (
  trackingData: Array<PluginNodeTrackingData>,
  orphanedIds: Array<string>,
): void => {
  orphanedIds.forEach((orphanedId) => {
    const entryIndex: 0 = 0;
    const trackingEntry = trackingData.filter(
      entry => entry.id === orphanedId,
    )[entryIndex];
    if (trackingEntry) {
      const annotationNode = figma.getNodeById(trackingEntry.annotationId);
      if (annotationNode) {
        annotationNode.remove();
      }
    }
  });
};

/** WIP
 * @description A shared helper function to set up in-UI messages and the logger.
 *
 * @kind function
 * @name getKeystopNodes
 * @param {Object} context The current context (event) received from Figma.
 * @returns {Object} Contains an object with the current page as a javascript object,
 * a messenger instance, and a selection array (if applicable).
 */
const getKeystopNodes = (
  frameNode: FrameNode,
  trackingData: Array<PluginNodeTrackingData>,
  resetData: boolean = false,
) => {
  const nodes: Array<SceneNode> = [];

  // grab (or initialize) keystop list for the top frame
  const keystopListData = JSON.parse(frameNode.getPluginData(DATA_KEYS.keystopList) || null);
  let keystopList: Array<{
    id: string,
    position: number,
  }> = [];
  if (keystopListData) {
    keystopList = keystopListData;
  }

  if (keystopList.length > 0) {
    keystopList.forEach((keystopItem) => {
      const nodeToAdd: SceneNode = frameNode.findOne(node => node.id === keystopItem.id);

      if (nodeToAdd) {
        nodes.push(nodeToAdd);
      } else if (trackingData.length > 0) {
        // remove orphaned annotation
        cleanupAnnotations(trackingData, [keystopItem.id]);
      }
    });
  }

  // reset the top frame list – list should be reset when annotations are re-painted
  if (resetData) {
    frameNode.setPluginData(
      DATA_KEYS.keystopList,
      JSON.stringify([]),
    );
  }

  return nodes;
};

/** WIP
 * @description A shared helper function to set up in-UI messages and the logger.
 *
 * @kind function
 * @name getKeystopPosition
 * @param {Object} context The current context (event) received from Figma.
 * @returns {Object} Contains an object with the current page as a javascript object,
 * a messenger instance, and a selection array (if applicable).
 */
const getKeystopPosition = (node: SceneNode): {
  hasStop: boolean,
  position: number,
} => {
  // set up keystop blank
  const keystopPosition: {
    hasStop: boolean,
    position: number,
  } = {
    hasStop: false,
    position: null,
  };

  // find top frame for selected node
  const crawler = new Crawler({ for: [node] });
  const topFrame = crawler.topFrame();
  if (topFrame) {
    // read keystop list data from top frame
    const itemIndex = 0;
    const keystopList = JSON.parse(topFrame.getPluginData(DATA_KEYS.keystopList) || null);
    if (keystopList) {
      const keystopItem = keystopList.filter(item => item.id === node.id)[itemIndex];
      if (keystopItem) {
        keystopPosition.hasStop = true;
        keystopPosition.position = keystopItem.position;
      }
    }
  }

  return keystopPosition;
};

/** WIP
 * @description A class to handle core app logic and dispatch work to other classes.
 *
 * @class
 * @name App
 *
 * @constructor
 *
 * @property closeGUI A convenience function for closing the GUI and shutting down the plugin.
 * @property showGUI A convenience function for showing the GUI.
 * @property shouldTerminate A boolean that tells us whether or not the GUI should remain open
 * at the end of the plugin’s current task.
 */
export default class App {
  isMercadoMode: boolean;
  shouldTerminate: boolean;
  terminatePlugin: Function;

  constructor({
    isMercadoMode,
    shouldTerminate,
    terminatePlugin,
  }) {
    this.isMercadoMode = isMercadoMode;
    this.shouldTerminate = shouldTerminate;
    this.terminatePlugin = terminatePlugin;
  }

  /**
   * @description Resets the plugin GUI back to the original state or closes it entirely,
   * terminating the plugin.
   *
   * @kind function
   * @name closeOrReset
   *
   * @returns {null}
   */
  closeOrReset() {
    if (this.shouldTerminate) {
      return this.terminatePlugin();
    }

    return null;
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

    return this.closeOrReset();
  }

  /** WIP
   * @description Identifies and annotates a selected node or multiple nodes in a Figma file.
   *
   * @kind function
   * @name annotateKeystop
   *
   * @returns {null} Shows a Toast in the UI if nothing is selected.
   */
  async annotateKeystop(suppliedSelection?: Array<SceneNode>) {
    const {
      messenger,
      page,
      selection,
    } = assemble(figma);

    // need a selected node to annotate it
    if (
      (selection === null || selection.length === 0)
      && (suppliedSelection === null || suppliedSelection.length === 0)
    ) {
      messenger.log('Annotate keystop: nothing selected');
      return messenger.toast('A layer must be supplied');
    }

    // grab tracking data for the page
    const trackingData: Array<PluginNodeTrackingData> = JSON.parse(
      page.getPluginData(DATA_KEYS.keystopAnnotations) || [],
    );

    // set up selection based on supplied array or direct selection in the Figma UI
    // the direct UI selection is sorted based on visual hierarchy
    const crawlerForSelection = new Crawler({ for: selection });
    let selectedNodes: Array<SceneNode> = crawlerForSelection.sorted();
    if (suppliedSelection && suppliedSelection.length > 0) {
      selectedNodes = suppliedSelection;
    }

    // determine topFrames involved in the current selection
    const crawlerForSelected = new Crawler({ for: selectedNodes });
    const topFrameNodes: Array<FrameNode> = crawlerForSelected.topFrames();

    // iterate topFrames and select nodes that already have annotations
    const nodes: Array<SceneNode> = [];
    topFrameNodes.forEach((topFrame: FrameNode) => {
      const keystopNodes: Array<SceneNode> = getKeystopNodes(topFrame, trackingData, true);
      keystopNodes.forEach(keystopNode => nodes.push(keystopNode));
    });

    // add in any directly-selected nodes that do not have annotations yet
    selectedNodes.forEach((node: SceneNode) => {
      if (!existsInArray(nodes, node.id)) {
        nodes.push(node);
      }
    });

    // re-paint the annotations
    nodes.forEach((node: SceneNode) => {
      // remove existing annotation
      cleanupAnnotations(trackingData, [node.id]);

      // set up Identifier instance for the node
      const identifier = new Identifier({
        for: node,
        data: page,
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
          paintResult = painter.addKeystop();
        }

        // read the response from Painter; if it was unsuccessful, log and display the error
        if (paintResult) {
          messenger.handleResult(paintResult);
          if (paintResult.status === 'error') {
            return null;
          }
        }
        return null;
      };

      // get/set the keystop info
      const identifierResult = identifier.getSetKeystop();

      // read the response from Identifier; if it was unsuccessful, log and display the error
      if (identifierResult) {
        messenger.handleResult(identifierResult);
        if (identifierResult.status === 'error') {
          return null;
        }
      }

      drawAnnotation(true);

      return null;
    });

    if (this.shouldTerminate) {
      this.closeOrReset();
    } else {
      App.refreshGUI();
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
              App.showGUI(messenger);
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
                this.closeOrReset();
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
      this.closeOrReset();
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
      App.showGUI(messenger);
    }

    // grab the node form the selection
    const node = new Crawler({ for: selection }).first();

    // set up Identifier instance for the node
    const nodeToAnnotate = new Identifier({
      for: node,
      data: page,
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

      return this.closeOrReset();
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

    return this.closeOrReset();
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

    return this.closeOrReset();
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

    return this.closeOrReset();
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

    return this.closeOrReset();
  }

  /** WIP
   * @description Enables/disables a feature-flag (`isMercadoMode`) used to expose
   * features specific to the Mercado Design Library. The flag is saved to local
   * storage so that it persists across files.
   *
   * @kind function
   * @name refreshGUI
   *
   * @returns {Promise} Returns a promise for resolution.
   */
  static async refreshGUI() {
    const {
      messenger,
      page,
      selection,
    } = assemble(figma);

    // get last-used filters from options
    const currentOptions: PluginOptions = await figma.clientStorage.getAsync(DATA_KEYS.options);
    const { currentView, isMercadoMode } = currentOptions;

    // calculate UI size, based on view type and selection
    let { width } = GUI_SETTINGS.default;
    let { height } = GUI_SETTINGS.default;
    switch (currentView) {
      case 'general': {
        if (isMercadoMode) {
          width = GUI_SETTINGS.mercadoDefault.width;
          height = GUI_SETTINGS.mercadoDefault.height;
        }
        break;
      }
      case 'a11y-headings':
      case 'a11y-keyboard':
      case 'a11y-labels':
        width = GUI_SETTINGS.accessibilityDefault.width;
        height = GUI_SETTINGS.accessibilityDefault.height;
        break;
      default:
        return null;
    }

    const nodes: Array<SceneNode> = [];
    const sessionKey = null; // tktk
    const selected: {
      items: Array<{
        id: string,
        name: string,
        hasStop: boolean,
      }>
    } = { items: [] };

    // specific to `a11y-keyboard`
    if (currentView === 'a11y-keyboard') {
      // grab tracking data for the page
      const trackingData: Array<PluginNodeTrackingData> = JSON.parse(
        page.getPluginData(DATA_KEYS.keystopAnnotations) || [],
      );

      // iterate through each node in a selection
      const selectedNodes: Array<SceneNode> = selection;

      // determine topFrames involved in the current selection
      const crawlerForSelected = new Crawler({ for: selectedNodes });
      const topFrameNodes: Array<FrameNode> = crawlerForSelected.topFrames();

      // iterate topFrames and select nodes that already have annotations
      topFrameNodes.forEach((topFrame: FrameNode) => {
        const keystopNodes: Array<SceneNode> = getKeystopNodes(topFrame, trackingData);
        keystopNodes.forEach(keystopNode => nodes.push(keystopNode));
      });

      // add in any directly-selected nodes that do not have annotations yet
      selectedNodes.forEach((node: SceneNode) => {
        if (!existsInArray(nodes, node.id)) {
          nodes.push(node);
        }
      });

      // set up selected bundle
      nodes.forEach((node: SceneNode) => {
        const { id, name } = node;
        const { hasStop, position } = getKeystopPosition(node);
        const viewObject = {
          id,
          name,
          position,
          hasStop,
        };

        selected.items.push(viewObject);
      });
    } else {
      nodes.forEach((node: SceneNode) => {
        const { id, name } = node;
        const viewObject = {
          id,
          name,
          hasStop: false,
        };

        selected.items.push(viewObject);
      });
    }

    // send the updates to the UI
    figma.ui.postMessage({
      action: 'refreshState',
      payload: {
        currentView,
        isMercadoMode,
        selected,
        sessionKey,
        // guiStartSize: newGUIHeight,
      },
    });

    // commit the calculated size
    if (
      (currentView !== 'a11y-keyboard')
      || ((currentView === 'a11y-keyboard') && selected.items.length < 1)
    ) {
      figma.ui.resize(
        width,
        height,
      );
    }

    messenger.log(`Updating UI view (${currentView}) with ${nodes.length} selected ${nodes.length === 1 ? 'node' : 'nodes'}`);
    return null;
  }

  /** WIP
   * @description Identifies and annotates a selected node or multiple nodes in a Figma file.
   *
   * @kind function
   * @name removeKeystops
   *
   * @returns {null} Shows a Toast in the UI if nothing is selected.
   */
  async removeKeystops(nodeId?: string) {
    const {
      messenger,
      page,
      selection,
    } = assemble(figma);

    if (!nodeId && selection.length < 1) {
      messenger.log('Cannot remove keystop; missing node ID(s)', 'error');
    }

    let nodes = selection;
    if (nodeId) {
      const node: BaseNode = figma.getNodeById(nodeId);
      if (node) {
        nodes = [node];
      }
    }

    // determine topFrames involved in the current selection
    const crawler = new Crawler({ for: nodes });
    const topFrameNodes: Array<FrameNode> = crawler.topFrames();

    // iterate topFrames and remove annotation(s) that match node(s)
    topFrameNodes.forEach((frameNode: FrameNode) => {
      // read keystop list data from top frame
      const keystopList: Array<{
        id: string,
        position: number,
      }> = JSON.parse(frameNode.getPluginData(DATA_KEYS.keystopList) || null);

      // remove item(s) from the keystop list
      let newKeystopList = keystopList;
      if (keystopList) {
        nodes.forEach((node) => {
          newKeystopList = updateArray(newKeystopList, node, 'id', 'remove');
        });
      }

      // set new keystop list
      frameNode.setPluginData(
        DATA_KEYS.keystopList,
        JSON.stringify(newKeystopList),
      );
    });

    // remove the corresponding annotations
    const nodeIds: Array<string> = [];
    nodes.forEach(node => nodeIds.push(node.id));

    // grab tracking data for the page
    const trackingData: Array<PluginNodeTrackingData> = JSON.parse(
      page.getPluginData(DATA_KEYS.keystopAnnotations) || [],
    );
    cleanupAnnotations(trackingData, nodeIds);

    // close or refresh UI
    if (this.shouldTerminate) {
      this.closeOrReset();
    } else {
      App.refreshGUI();
    }
    return null;
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
    let newGUIHeight = bodyHeight + 14; // add buffer for info trigger
    if (newGUIHeight < GUI_SETTINGS.accessibilityDefault.height) {
      newGUIHeight = GUI_SETTINGS.accessibilityDefault.height;
    }

    if (bodyHeight && newGUIHeight) {
      figma.ui.resize(
        GUI_SETTINGS.accessibilityDefault.width,
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
   * @name setViewContext
   *
   * @returns {Promise} Returns a promise for resolution.
   */
  static async setViewContext(payload: { newView: PluginViewTypes }) {
    const { newView }: { newView: PluginViewTypes } = payload;

    // retrieve existing options
    let options: any = {};
    const lastUsedOptions: PluginOptions = await figma.clientStorage.getAsync(DATA_KEYS.options);
    if (lastUsedOptions !== undefined) {
      options = lastUsedOptions;
    }

    // set new view without changing other options
    options.currentView = newView;

    // save new options to storage
    await figma.clientStorage.setAsync(DATA_KEYS.options, options);

    // refresh the view
    App.refreshGUI();
  }

  /**
   * @description Displays the plugin GUI within Figma.
   *
   * @kind function
   * @name showGUI
   *
   * @param {Object} options Can include `size` calling one of the UI sizes defined
   * in GUI_SETTINGS  and/or an initialized instance of the Messenger class for
   * logging (`messenger`). Both are optional.
   *
   * @returns {null}
   */
  static async showGUI(messenger?: { log: Function }) {
    if (messenger) {
      messenger.log('Display GUI');
    }

    // show UI
    figma.ui.show();

    return null;
  }

  /**
   * @description Triggers a UI refresh and then displays the plugin UI.
   *
   * @kind function
   * @name showToolbar
   *
   * @param {string} sessionKey A rotating key used during the single run of the plugin.
   */
  static async showToolbar() {
    const { messenger } = assemble(figma);

    await App.refreshGUI();
    await App.showGUI(messenger);
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
    const lastUsedOptions: PluginOptions = await figma.clientStorage.getAsync(DATA_KEYS.options);

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

    // reset the view to “general”
    await this.setViewContext({ newView: 'general' });

    // show the toolbar
    await this.showToolbar();
  }

  /** WIP
   * @description Identifies and annotates a selected node or multiple nodes in a Figma file.
   *
   * @kind function
   * @name updateKeystops
   *
   * @returns {null} Shows a Toast in the UI if nothing is selected.
   */
  async updateKeystops(params: {
    id: string,
    position: string,
  }) {
    const { messenger } = assemble(figma);

    const nodeId: string = params.id;
    // force the new position into a positive integer
    let newPosition: number = parseInt(params.position, 10);

    if (!nodeId || !newPosition) {
      messenger.log('Cannot update keystops; missing node ID or new position', 'error');
    }

    const nodesToRepaint: Array<SceneNode> = [];
    let nodes: Array<BaseNode> = [];
    const node: BaseNode = figma.getNodeById(nodeId);
    if (node) {
      nodes = [node];
    }

    // determine topFrames involved in the current selection
    const crawler = new Crawler({ for: nodes });
    const topFrameNodes: Array<FrameNode> = crawler.topFrames();

    // iterate topFrames and remove annotation(s) that match node(s)
    topFrameNodes.forEach((frameNode: FrameNode) => {
      // read keystop list data from top frame
      const keystopList: Array<{
        id: string,
        position: number,
      }> = JSON.parse(frameNode.getPluginData(DATA_KEYS.keystopList) || null);

      // remove item(s) from the keystop list
      let newKeystopList = [];
      if (keystopList) {
        // number items
        const numberItems = keystopList.length;

        // validate and adjust based on actual number of items
        if (newPosition > numberItems) {
          newPosition = numberItems;
        }

        // find the old position
        const index = 0;
        const selectedItem = keystopList.filter(keystopItem => keystopItem.id === nodeId)[index];
        const oldPosition = selectedItem.position;

        // compare new/old positions and, if applicable, set up the new list
        if (newPosition === oldPosition) {
          // do nothing if the positions match
          newKeystopList = keystopList;
        } else {
          const setPosition = (currentPosition: number, itemId: string): number => {
            // the selected node always gets the new position
            if (itemId === nodeId) {
              return newPosition;
            }

            // how we manipulate the new position is based on relationship to the
            // _selected_ node’s old position:
            //
            // nodes higher in the list relative to the old position may need to be moved lower;
            // nodes lower in the list relative to the old position may need to be moved higher.
            if (currentPosition > oldPosition) {
              // when current position is less than the _new_ position, subtract 1
              if (currentPosition <= newPosition) {
                return (currentPosition - 1);
              }
            } else if (currentPosition >= newPosition) {
              // when current position is greater than the _new_ position, add 1
              return (currentPosition + 1);
            }
            return currentPosition;
          };

          // build the new list
          keystopList.forEach((keystopItem) => {
            // stub in new entry based on old values
            const newItemEntry = {
              id: keystopItem.id,
              position: setPosition(keystopItem.position, keystopItem.id),
            };

            newKeystopList.push(newItemEntry);
          });
        }
      }

      // sort the new list by position
      const sortByPosition = (keystopItemA, keystopItemB) => {
        const aPosition = keystopItemA.position;
        const bPosition = keystopItemB.position;
        if (aPosition < bPosition) {
          return -1;
        }
        if (aPosition > bPosition) {
          return 1;
        }
        return 0;
      };
      newKeystopList = newKeystopList.sort(sortByPosition);

      // commit the new keystop list
      frameNode.setPluginData(
        DATA_KEYS.keystopList,
        JSON.stringify(newKeystopList),
      );

      // use the new, sorted list to select the original nodes in figma
      newKeystopList.forEach((keystopItem) => {
        const itemNode: BaseNode = figma.getNodeById(keystopItem.id);
        if (itemNode) {
          nodesToRepaint.push(itemNode as SceneNode);
        }
      });
    });

    // repaint affected nodes
    this.annotateKeystop(nodesToRepaint);

    // close or refresh UI
    if (this.shouldTerminate) {
      this.closeOrReset();
    } else {
      App.refreshGUI();
    }
    return null;
  }
}
