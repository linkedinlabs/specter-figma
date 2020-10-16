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

/**
 * @description Checks tracking data against an array of orphaned IDs. If the IDs match,
 * the annotation is removed.
 *
 * @kind function
 * @name cleanupAnnotations
 *
 * @param {Array} trackingData The page-level node tracking data.
 * @param {Array} orphanedIds An array of node IDs we know are no longer on the Figma page.
 *
 * @returns {null}
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
  return null;
};

/**
 * @description Takes a frame node and uses its list data to create an array of nodes that
 * currently have Keystop Annotations. The `trackingData` is used in case the list is stale
 * and we need to clean up annotations that no longer exist.
 *
 * @kind function
 * @name getKeystopNodes
 *
 * @param {Object} frameNode The top-level frame node we want to locate Keystops within.
 * @param {Array} trackingData The page-level node tracking data.
 * @param {boolean} resetData Set to true if we know annotations are being re-painted and
 * the top-level frame node’s list data should be cleared out.
 *
 * @returns {Array} An array of nodes (SceneNode) with Keystop Annotations.
 */
const getKeystopNodes = (
  frameNode: FrameNode,
  trackingData: Array<PluginNodeTrackingData>,
  resetData: boolean = false,
): Array<SceneNode> => {
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

/**
 * @description Takes a node and locates its current Keystop data (position and keys), if
 * it exists. The data is located through the node’s top-level frame. Returns an object
 * formatted to pass along to the UI.
 *
 * @kind function
 * @name getKeystopPosition
 *
 * @param {Object} node A SceneNode to check for Keystop data.
 *
 * @returns {Object} An object formatted for the UI including `hasStop`, a boolean indicating
 * the presence of a keystop, the current position if the stop exists, and any keys (as an array),
 * if they exist.
 */
const getKeystopPosition = (node: SceneNode): {
  hasStop: boolean,
  keys: Array<PluginKeystopKeys>,
  position: number,
} => {
  // set up keystop blank
  const keystopPosition: {
    hasStop: boolean,
    keys: Array<PluginKeystopKeys>,
    position: number,
  } = {
    hasStop: false,
    keys: null,
    position: null,
  };

  // find keys data for selected node
  const nodeData = JSON.parse(node.getPluginData(DATA_KEYS.keystopNodeData) || null);
  if (nodeData && nodeData.keys) {
    const { keys } = nodeData;
    keystopPosition.keys = keys;
  }

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

/**
 * @description Retrieves the current options saved to `clientStorage`. If none exist,
 * defaults are set.
 *
 * @kind function
 * @name getOptions
 *
 * @returns {Object} Returns the options (currently `currentView` and `isMercadoMode`.
 */
const getOptions = async (): Promise<PluginOptions> => {
  // set default options
  let options: PluginOptions = {
    currentView: 'general',
    isMercadoMode: false,
  };

  // retrieve last used, and use if they exist
  const lastUsedOptions: PluginOptions = await figma.clientStorage.getAsync(DATA_KEYS.options);
  if (lastUsedOptions !== undefined) {
    options = lastUsedOptions;
  }

  // check for defaults
  const {
    currentView,
    isMercadoMode,
  }: {
    currentView: PluginViewTypes,
    isMercadoMode: boolean,
  } = options;

  if ((currentView === undefined) || (currentView === null)) {
    options.currentView = 'general';
  }

  if (isMercadoMode === undefined) {
    options.isMercadoMode = false;
  }

  return options;
};

/**
 * @description A class to handle core app logic and dispatch work to other classes.
 *
 * @class
 * @name App
 *
 * @constructor
 *
 * @property isMercadoMode A feature-flag (`isMercadoMode`) used to expose features specific to
 * the Mercado Design Library.
 * @property shouldTerminate A boolean that tells us whether or not the GUI should remain open
 * at the end of the plugin’s current task.
 * @property terminatePlugin A function to shut down the plugin and close the GUI.
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

  /**
   * @description Annotates a selected node or multiple nodes in a Figma file with
   * focus order keystop annotations.
   *
   * @kind function
   * @name annotateKeystop
   *
   * @param {Array} suppliedSelection If present, this array of nodes will override the
   * nodes found in current selection.
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

  /**
   * @description Retrieves a node based on the supplied `id` and draws an auxilarly Key Annotation
   * based on the supplied `key`.
   *
   * @kind function
   * @name keystopAddRemoveKeys
   *
   * @param {Object} options Should include a Figma node `id` and the `key` to be added.
   * @param {boolean} removeKey Default is `false`. If set to `true`, the list of keystops will not
   * be re-painted after an update, effectively removing the annotation that corresponds to the
   * supplied `id` in `options`.
   *
   * @returns {null}
   */
  keystopAddRemoveKeys(
    options: {
      id: string,
      key: PluginKeystopKeys,
    },
    removeKey: boolean = false,
  ) {
    const { id, key } = options;
    const node: BaseNode = figma.getNodeById(id);

    if (node) {
      // retrieve the node data
      const nodeData = JSON.parse(node.getPluginData(DATA_KEYS.keystopNodeData) || null);
      if (nodeData) {
        let keys: Array<PluginKeystopKeys> = [];
        if (nodeData.keys) {
          keys = nodeData.keys;
        }

        let newKeys: Array<PluginKeystopKeys> = keys;
        keys.forEach((keyEntry, index) => {
          if (keyEntry === key) {
            if (index > -1) {
              newKeys = [
                ...newKeys.slice(0, index),
                ...newKeys.slice(index + 1),
              ];
            }
          }
        });

        if (!removeKey) {
          newKeys.push(key);
        }

        nodeData.keys = newKeys;
        node.setPluginData(
          DATA_KEYS.keystopNodeData,
          JSON.stringify(nodeData),
        );
      }

      // repaint the node
      this.annotateKeystop([node as SceneNode]);
    }

    // close or refresh UI
    if (this.shouldTerminate) {
      this.closeOrReset();
    } else {
      App.refreshGUI();
    }
    return null;
  }

  /**
   * @description Triggers a UI refresh with the current selection. In the case of the
   * `a11y-keyboard` view context, the necessary data is collected and an object is passed
   * over to the UI thread.
   *
   * @kind function
   * @name refreshGUI
   *
   * @returns {null}
   */
  static async refreshGUI() {
    const {
      messenger,
      page,
      selection,
    } = assemble(figma);

    // retrieve existing options
    const options: PluginOptions = await getOptions();

    const { currentView, isMercadoMode } = options;

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
    const items: Array<{
      id: string,
      name: string,
      position?: number,
      hasStop: boolean,
      isSelected: boolean,
    }> = [];

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
        const {
          hasStop,
          keys,
          position,
        } = getKeystopPosition(node);
        const viewObject = {
          id,
          name,
          position,
          hasStop,
          isSelected: existsInArray(selectedNodes, node.id),
          keys,
        };

        items.push(viewObject);
      });
    } else {
      nodes.forEach((node: SceneNode) => {
        const { id, name } = node;
        const viewObject = {
          id,
          name,
          hasStop: false,
          isSelected: true,
        };

        items.push(viewObject);
      });
    }

    // send the updates to the UI
    figma.ui.postMessage({
      action: 'refreshState',
      payload: {
        currentView,
        isMercadoMode,
        items,
        sessionKey,
        // guiStartSize: newGUIHeight,
      },
    });

    // commit the calculated size
    if (
      (currentView !== 'a11y-keyboard')
      || ((currentView === 'a11y-keyboard') && items.length < 1)
    ) {
      figma.ui.resize(
        width,
        height,
      );
    }

    messenger.log(`Updating UI view (${currentView}) with ${nodes.length} selected ${nodes.length === 1 ? 'node' : 'nodes'}`);
    return null;
  }

  /**
   * @description Retrieves a node based on the supplied `nodeId` or uses the current selection
   * and removes associated Keystop annotations and auxilary key annotations.
   *
   * @kind function
   * @name removeKeystops
   *
   * @param {string} nodeId The `id` of a Figma node with a Keystop annotation.
   *
   * @returns {null} Shows a Toast in the UI if a `nodeId` is not supplied.
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

    const nodesToRepaint: Array<SceneNode> = [];
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

      // use the new, sorted list to select the original nodes in figma
      newKeystopList.forEach((keystopItem) => {
        const itemNode: BaseNode = figma.getNodeById(keystopItem.id);
        if (itemNode) {
          nodesToRepaint.push(itemNode as SceneNode);
        }
      });
    });

    // remove the corresponding annotations
    const nodeIds: Array<string> = [];
    nodes.forEach(node => nodeIds.push(node.id));

    // grab tracking data for the page
    const trackingData: Array<PluginNodeTrackingData> = JSON.parse(
      page.getPluginData(DATA_KEYS.keystopAnnotations) || [],
    );
    cleanupAnnotations(trackingData, nodeIds);

    // repaint affected nodes
    if (nodesToRepaint.length > 0) {
      this.annotateKeystop(nodesToRepaint);
    }

    // close or refresh UI
    if (this.shouldTerminate) {
      this.closeOrReset();
    } else {
      App.refreshGUI();
    }
    return null;
  }

  /**
   * @description Resizes the plugin UI based on either a default, or a provided
   * `bodyHeight` in the `payload` object. The object is sent from the UI thread.
   *
   * @kind function
   * @name resizeGUI
   *
   * @param {Object} payload Should contain `bodyHeight` as the height of the current
   * contents calculated in the UI.
   *
   * @returns {Promise} Returns a promise for resolution.
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

  /**
   * @description Handles setting the UI view context based on a view type sent
   * from the UI thread. The new view type is saved to `clientStorage` and the `refreshGUI`
   * function is called.
   *
   * @kind function
   * @name setViewContext
   *
   * @param {Object} payload Should contain `newView` as the height of the current
   * contents calculated in the UI.
   *
   * @returns {Promise} Returns a promise for resolution.
   */
  static async setViewContext(payload: { newView: PluginViewTypes }) {
    const { newView }: { newView: PluginViewTypes } = payload;

    // retrieve existing options
    const options: PluginOptions = await getOptions();

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
   * @param {Object} messenger An initialized instance of the Messenger class for
   * logging (optional).
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
   * @returns {Promise} Returns a promise for resolution.
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
    const options: PluginOptions = await getOptions();

    // set preliminary mercado mode
    const currentIsMercadoMode: boolean = options.isMercadoMode;

    // set new mercado mode flag without changing other options
    options.isMercadoMode = !currentIsMercadoMode;

    // save new options to storage
    await figma.clientStorage.setAsync(DATA_KEYS.options, options);

    // reset the view to “general”
    await this.setViewContext({ newView: 'general' });

    // show the toolbar
    await this.showToolbar();
  }

  /**
   * @description Retrieves a node based on the supplied `id` and uses the `position` to update
   * the node’s Keystop annotation. Any annotations in the top frame with new numbers are
   * re-painted.
   *
   * @kind function
   * @name updateKeystops
   *
   * @param {Object} options Should include a Figma node `id` and the `key` to be added.
   *
   * @returns {null}
   */
  async updateKeystops(options: {
    id: string,
    position: string,
  }) {
    const { messenger } = assemble(figma);

    const nodeId: string = options.id;
    // force the new position into a positive integer
    let newPosition: number = parseInt(options.position, 10);

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
