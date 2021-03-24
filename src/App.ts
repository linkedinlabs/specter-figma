import Crawler from './Crawler';
import Identifier from './Identifier';
import Messenger from './Messenger';
import Painter from './Painter/Painter';
import { getOrderedStopNodes } from './utils/nodeGetters';
import { DATA_KEYS, GUI_SETTINGS } from './constants';
import {
  deepCompare,
  existsInArray,
  resizeGUI,
  sortByPosition,
  findTopFrame,
  updateArray,
  getStopTypeFromView,
  isAnnotationLayer,
} from './utils/tools';
import {
  refreshLegend,
  positionLegend,
  updateAnnotationNum,
  updateLegendEntry,
} from './Painter/annotationBuilders';

/**
 * @description A shared helper function to set up in-UI messages and the logger.
 *
 * @kind function
 * @name assemble
 * @param {Object} context The current context (global `figma` event) received from Figma.
 * @returns {Object} Contains an object with the current page as a javascript object,
 * a messenger instance, and a selection array (if applicable).
 */
const assemble = (context: any = null) => {
  const page = context.currentPage;
  // don't include actual annotations
  const selection = page.selection.filter(item => !isAnnotationLayer(item));
  const messenger = new Messenger({ for: context, in: page });

  return {
    messenger,
    page,
    selection,
  };
};

/**
 * @description Checks tracking data against an array of IDs of design nodes no longer
 * on the art board. If the IDs match, the annotation is removed.
 *
 * @kind function
 * @name removeLinkedAnnotationNodes
 *
 * @param {Array} trackingData The page-level node tracking data.
 * @param {Array} nodeIds An array of IDs of design nodes we know are no longer on the Figma page.
 *
 * @returns {undefined}
 */
const removeLinkedAnnotationNodes = (
  trackingData: Array<PluginNodeTrackingData>,
  nodeIds: Array<string>,
): void => {
  nodeIds.forEach((id) => {
    const trackingEntry = trackingData.find(entry => entry.id === id);
    const annotationNode = trackingEntry && figma.getNodeById(trackingEntry.annotationId);
    const legendItemNode = trackingEntry?.legendItemId
      && figma.getNodeById(trackingEntry.legendItemId);

    if (annotationNode) {
      annotationNode.remove();
    }
    if (legendItemNode) {
      legendItemNode.remove();
    }
  });
};

/**
 * @description Checks the position of the frame against tracking data to detect whether
 * it has moved, and updates the legend frame position if so.
 *
 * @kind function
 * @name diffTopFramePosition
 *
 * @param {Object} currentPosition The current position of the frame.
 * @param {Object} trackedPosition The frame position last saved in tracking data.
 * @param {string} legendId The legend ID listed in the tracking data.
 *
 * @returns {undefined}
 */
const diffTopFramePosition = (
  currentPosition: PluginFramePosition,
  trackedPosition: PluginFramePosition,
  legendId: string,
): void => {
  if (deepCompare(currentPosition, trackedPosition)) {
    const legendFrame = figma.getNodeById(legendId) as FrameNode;
    if (legendFrame) {
      positionLegend(legendFrame, currentPosition);
    }
  }
};

/**
 * @description Checks the tracking data for the legend and removes any legend records
 * that are out of sync.  They will be rebuilt once the method to fix node links runs.
 *
 * @kind function
 * @name repairBrokenLegendLinks
 *
 * @param {Object} page The type page the selections are on.
 *
 * @returns {undefined}
 */
const repairBrokenLegendLinks = (
  page: PageNode,
): void => {
  const trackingData: Array<PluginFrameTrackingData> = JSON.parse(
    page.getPluginData(DATA_KEYS.legendFrames) || '[]',
  );
  let updatedTrackingData = [];

  page.children.forEach((child) => {
    const linkData = child.type === 'FRAME'
      && JSON.parse(child.getPluginData(DATA_KEYS.legendLinkId) || null);
    const trackingEntry = linkData && trackingData.find(entry => entry.linkId === linkData.id);

    if (linkData?.role === 'frame') {
      const framePosition: PluginFramePosition = {
        x: child.x,
        y: child.y,
        width: child.width,
        height: child.height,
      };

      if (trackingEntry && trackingEntry.id !== child.id) {
        // most likely a copy of another frame, remove duplicated tracking
        child.setPluginData(DATA_KEYS.legendLinkId, JSON.stringify(null));
      } else if (trackingEntry?.legendId) {
        // retain valid tracking entry and check for position change
        updatedTrackingData = updateArray(updatedTrackingData, trackingEntry, 'id', 'add');
        diffTopFramePosition(framePosition, trackingEntry.framePosition, trackingEntry.legendId);
      }
    } else if (linkData?.role === 'legend'
      && (
        !trackingData.map(entry => entry.legendId).includes(child.id)
        || !figma.getNodeById(trackingEntry?.id)
      )
    ) {
      // removes any legends not listed in tracking or with a missing design frame
      child.remove();
    }
  });

  page.setPluginData(DATA_KEYS.legendFrames, JSON.stringify(updatedTrackingData));
};

/**
 * @description Checks frame list data against annotations and uses linkId between annotation
 * and original node to determine if the link is broken. Annotations for broken links are
 * removed and new annotations are drawn, if possible. The main use-case for this is when
 * an artboard (top frame) containing annotations is duplicated. We want to re-initialize
 * our data so that the Specter UI accurately represents the annotations on the _new_ top
 * frame.
 *
 * @kind function
 * @name handleDuplicatedNodes
 *
 * @param {Object} options Includes `type`: the type of stop annotation to repair,
 * `frameNode`: a top frame node to evaluate for context;
 * `trackingData`: the page-level node tracking data; `page`: the Figma PageNode;
 * `messenger`: an initialized instance of the Messenger class for logging; and
 * `isMercadoMode`: designates whether “Mercado” rules apply.
 *
 * @returns {null}
 */
const handleDuplicatedNodes = (
  options: {
    type: PluginStopType,
    isMercadoMode: boolean,
    messenger: any,
    page: PageNode,
    frame: FrameNode,
    nodes: Array<SceneNode>,
    trackingData: Array<PluginNodeTrackingData>,
  },
): void => {
  // ----- remove annotations with broken links
  const {
    type,
    isMercadoMode,
    page,
    frame,
    nodes,
    messenger,
    trackingData,
  } = options;

  const list = JSON.parse(frame.getPluginData(DATA_KEYS[`${type}List`]) || null);

  if (list?.length) {
    let updatesMade = false;

    const nodeLinks = nodes.reduce((acc, node) => {
      const nodeExists = figma.getNodeById(node.id);
      const linkId = nodeExists && JSON.parse(node.getPluginData(DATA_KEYS[`${type}LinkId`]) || null);
      if (linkId?.role) {
        acc[`${linkId.role}Roles`].push({ id: linkId.id, node });
      }
      return acc;
    }, { annotationRoles: [], nodeRoles: [] });

    nodeLinks.nodeRoles.forEach(({ id, node }) => {
      const trackingEntry = trackingData.find(({ linkId }) => linkId === id);
      if (
        trackingEntry
        && (trackingEntry.id !== node.id || trackingEntry.topFrameId !== frame.id)
      ) {
        // ensure node that corresponds to annotation doesn't exist in current top frame.
        if (!frame.findOne(child => child.id === trackingEntry.id)) {
          const linkAnnotation = nodeLinks.annotationRoles.find(link => link.id === id);

          if (linkAnnotation && figma.getNodeById(linkAnnotation.node.id)) {
            linkAnnotation.node.remove();
            updatesMade = true;
          }

          // find the index of a pre-existing `id` match on the array
          const index: number = list.findIndex(match => match.id === trackingEntry.id);
          if (index > -1) {
            list[index].id = node.id;
          }
        }
      }
    });
    // if updates were made, we need reset the stop list and re-paint annotations
    if (updatesMade) {
      const nodesToReannotate: Array<string> = [];
      list.forEach((listEntry) => {
        if (!nodesToReannotate.includes(listEntry.id)) {
          nodesToReannotate.push(listEntry.id);
        }
      });

      frame.setPluginData(DATA_KEYS[`${type}List`], '[]');

      // iterate nodes to re-assign and re-paint
      nodesToReannotate.forEach((nodeId: string) => {
        // need to re-check for a node's existence since we are deleting as we go
        const nodeToReassign: BaseNode = figma.getNodeById(nodeId);
        if (nodeToReassign) {
          // set up Identifier instance for the node
          const identifier = new Identifier({
            for: nodeToReassign,
            data: page,
            isMercadoMode,
            messenger,
          });

          // get/set the stop info
          const identifierResult = identifier.getSetStop(type);
          messenger.handleResult(identifierResult, true);

          if (identifierResult.status === 'success') {
            // set up Painter instance for the node
            const painter = new Painter({
              for: nodeToReassign,
              in: page,
              isMercadoMode,
            });

            // re-draw the annotation
            const painterResult = painter.addStop(type);
            messenger.handleResult(painterResult, true);
          }
        }
      });
    }
  }
  return null;
};

/**
 * @description Checks tracking data against the provided frameNode. If any annotations
 * are missing, they are re-painted. If any links are broken/invalidated, annotations are removed.
 *
 * @kind function
 * @name refreshAnnotations
 *
 * @param {string} type The type of annotation to repair (`keystop` or `label`).
 * @param {boolean} isMercadoMode Designates whether “Mercado” rules apply.
 * @param {Object} page The Figma PageNode.
 * @param {Object} trackingData The page-level node tracking data.
 *
 * @returns {undefined}
 */
const refreshAnnotations = (
  type: PluginStopType,
  isMercadoMode: boolean,
  page: PageNode,
  trackingData: Array<PluginNodeTrackingData>,
) => {
  trackingData.forEach((trackingEntry) => {
    const node: BaseNode = figma.getNodeById(trackingEntry.id);
    const frame: FrameNode = node && findTopFrame(node);
    // tktk: need to revisit the below, seems weird to have to instantiate App class
    // eslint-disable-next-line no-use-before-define
    const app = new App({ isMercadoMode, shouldTerminate: false, terminatePlugin: false });

    if (!node || (frame && frame.id !== trackingEntry.topFrameId)) {
      const oldFrame = figma.getNodeById(trackingEntry.topFrameId) as FrameNode;
      app.removeStopAnnotation(type, trackingEntry.id, oldFrame);

      if (node && frame) {
        app.annotateStops(type, [node as SceneNode]);
      }
    } else if (node && frame && !figma.getNodeById(trackingEntry.annotationId)) {
      const painter = new Painter({ for: node, in: page, isMercadoMode });
      painter.addStop(type);
    }
  });
};

/**
 * @description Compares current tracking data for stop nodes against the design nodes
 * themselves. If the nodes have changed size/position, we update the node’s corresponding
 * annotation. If the node has not changed, but its annotation is missing, we re-paint it.
 *
 * @kind function
 * @name diffAnnotationLocations
 *
 * @param {boolean} isMercadoMode Designates whether “Mercado” rules apply.
 * @param {Object} messenger The class that handles error messaging.
 * @param {Object} page The Figma PageNode.
 * @param {Object} selection The figma selection to diff.
 *
 * @returns {undefined}
 */
const diffAnnotationLocations = (
  isMercadoMode: boolean,
  messenger: any,
  page: PageNode,
  selection: Array<any>,
) => {
  const types: Array<PluginStopType> = ['keystop', 'label', 'heading'];
  const frame: FrameNode = findTopFrame(selection[0]);
  const nodes = new Crawler({ for: [frame] }).all();

  repairBrokenLegendLinks(page);

  types.forEach((type) => {
    const trackingData: Array<PluginNodeTrackingData> = JSON.parse(
      page.getPluginData(DATA_KEYS[`${type}Annotations`]) || '[]',
    );
    refreshAnnotations(type, isMercadoMode, page, trackingData);
    handleDuplicatedNodes({
      type,
      trackingData,
      page,
      frame,
      nodes,
      messenger,
      isMercadoMode,
    });
  });
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
    isInfo: false,
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
 * @description Invokes Figma’s `setRelaunchData` on the passed node and sets up
 * relaunch buttons. The buttons in-use are also saved/tracked on the node’s data.
 *
 * @kind function
 * @name setRelaunchCommands
 *
 * @param {Object} node The node (`BaseNode`) to use with `setRelaunchData`.
 * @param {string} command The possible commands to pass along. These commands must match
 * what is available in the manfiest.json file under “relaunchButtons”.
 *
 * @returns {null}
 */
const setRelaunchCommands = (
  node: BaseNode,
  command: 'annotate' | 'annotate-custom' | 'measure',
): void => {
  const commandBundle = [];

  // check for existing buttons (saved to plugin data because we cannot read them from
  // Figma directly) and add them to the temporary bundle array
  const existingRelaunchButtons = JSON.parse(node.getPluginData(DATA_KEYS.relaunch) || null);
  if (existingRelaunchButtons && existingRelaunchButtons.length > 0) {
    existingRelaunchButtons.forEach((existingCommand) => {
      commandBundle.push(existingCommand);
    });
  }

  // if the current `command` is new, add it to the bundle array
  if (!commandBundle.includes(command)) {
    commandBundle.push(command);
  }

  // set up the button commands object that Figma expects.
  // add commands from the command bundle to it
  const buttonBundle: {} = {};
  commandBundle.forEach((bundledCommand) => {
    buttonBundle[bundledCommand] = '';
  });

  // pass the button commands object to Figma's relaunch button helper
  node.setRelaunchData(buttonBundle);

  // add “Annotate” to top frame
  const topFrameNode = findTopFrame(node);
  if (topFrameNode) {
    topFrameNode.setRelaunchData({
      annotate: '',
    });
  }

  // add “Open Specter” to page
  figma.currentPage.parent.setRelaunchData({
    tools: '',
  });

  // save the current command bundle array to the node for future use
  node.setPluginData(DATA_KEYS.relaunch, JSON.stringify(commandBundle));

  return null;
};

/**
 * @description Takes a node and locates its current stop data, if it exists.
 * The data is located through the node’s top-level frame. Returns an object
 * formatted to pass along to the UI.
 *
 * @kind function
 * @name getStopData
 *
 * @param {string} type The type of annotation to get stop data for.
 * @param {Object} node A SceneNode to check for attached data.
 *
 * @returns {Object} An object formatted for the UI including `hasStop`, a boolean indicating
 * the presence of a stop, the current position if the stop exists, and relevant data.
 */
const getStopData = (
  type: PluginStopType,
  node: SceneNode,
) => {
  // takes care of all UI defaults
  const stopData = {
    hasStop: false,
    position: null,
    keys: [],
    role: 'no-role',
    labels: {
      a11y: '',
      visible: false,
      alt: '',
    },
    heading: {
      level: 'no-level',
      visible: true,
      invisible: '',
    },
  };
  const nodeData = JSON.parse(node.getPluginData(DATA_KEYS[`${type}NodeData`]) || '{}');

  // set data for each field (will only set what it grabs based on type)
  ['keys', 'role', 'labels', 'heading'].forEach((property) => {
    // temporary workaround for 'none' issue
    if (nodeData[property] && !(property === 'role' && nodeData[property] === 'none')) {
      stopData[property] = nodeData[property];
    }
  });

  const frame = findTopFrame(node);
  const stopList = JSON.parse(frame?.getPluginData(DATA_KEYS[`${type}List`]) || null);
  const stopItem = stopList?.find(item => item.id === node.id);

  if (stopItem) {
    stopData.hasStop = true;
    stopData.position = stopItem.position;
  }

  return stopData;
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
            const paintResult = painter.addGeneralAnnotation();
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
   * focus order keystop annotations or Aria stop annotations.  Removed any existing annotations
   * before redrawing if they're affected (e.g. relative stop order).
   *
   * @kind function
   * @name annotateStops
   *
   * @param {string} type The type of annotations we want to apply to the selection.
   * @param {Array} suppliedNodes If present, this array of nodes will override the
   * nodes found in current selection.  Gives us the option to use this beyond the Figma
   * selection.
   *
   * @returns {undefined}
   */
  annotateStops(
    type: PluginStopType,
    suppliedNodes?: Array<SceneNode>, // only sent with keys updates
  ) {
    const { messenger, page, selection } = assemble(figma);

    if (!selection?.length && !suppliedNodes?.length) {
      messenger.log(`Annotate ${type}: nothing selected`);
      return messenger.toast('A layer must be supplied');
    }

    const nodesToAnnotate: Array<SceneNode> = getOrderedStopNodes(
      type,
      selection,
      true,
      suppliedNodes,
    );

    const trackingData: Array<PluginNodeTrackingData> = JSON.parse(
      page.getPluginData(DATA_KEYS[`${type}Annotations`]) || '[]',
    );

    nodesToAnnotate.forEach((node) => {
      removeLinkedAnnotationNodes(trackingData, [node.id]);

      // set up Identifier & Painter instances for the node
      const identifier = new Identifier({
        for: node,
        data: page,
        isMercadoMode: this.isMercadoMode,
        messenger,
      });

      const painter = new Painter({
        for: node,
        in: page,
        isMercadoMode: this.isMercadoMode,
      });

      // get/set the stop info and paint it
      const identifierResult = identifier.getSetStop(type);
      if (identifierResult) {
        messenger.handleResult(identifierResult);
        if (identifierResult.status === 'error') {
          return null;
        }
      }

      const paintResult = painter.addStop(type);
      if (paintResult) {
        messenger.handleResult(paintResult);
        if (paintResult.status === 'error') {
          return null;
        }
      }
      return null;
    });

    App.refreshGUI();
    return null;
  }

  /**
   * @description Identifies and annotates a selected node or multiple nodes in a Figma file.
   * NOTE: This is specific to the 'General' tab, not keyboard or labels.
   *
   * @kind function
   * @name annotateGeneral
   *
   * @returns {null} Shows a Toast in the UI if nothing is selected.
   */
  annotateGeneral() {
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
          paintResult = painter.addGeneralAnnotation();
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

      setRelaunchCommands(node, 'annotate');

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
   * @name annotateCustom
   *
   * @returns {null} Shows a Toast in the UI if nothing is selected or if multiple nodes
   * are selected.
   */
  annotateCustom() {
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
        paintResult = painter.addGeneralAnnotation();

        // read the response from Painter; if it was unsuccessful, log and display the error
        if (paintResult && (paintResult.status === 'error')) {
          return messenger.handleResult(paintResult);
        }
      }

      return this.closeOrReset();
    };

    // set the custom text
    setText(handleSetTextResult);
    setRelaunchCommands(node, 'annotate-custom');

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
      setRelaunchCommands(node, 'measure');
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
   * @description Retrieves a node based on the supplied `id` and updates the specified nodeData
   * property based on input from the UI.
   *
   * @kind function
   * @name updateNodeData
   *
   * @param {string} id The id of the design node to update nodeData for.
   * @param {string} key The key of the nodeData property to update.
   * @param {any} value The value to update the nodeData property to.
   *
   * @returns {undefined}
   */
  updateNodeData = (
    id: string,
    key: 'role' | 'labels' | 'heading' | 'keys',
    value: PluginLabelRole | PluginAriaLabels | PluginAriaHeading | Array<PluginKeystopKeys>,
  ) => {
    const node: BaseNode = figma.getNodeById(id);
    let type;
    if (['role', 'labels'].includes(key)) {
      type = 'label';
    } else if (key === 'keys') {
      type = 'keystop';
    } else {
      type = 'heading';
    }
    const nodeData = node && JSON.parse(node.getPluginData(DATA_KEYS[`${type}NodeData`]) || null);

    if (nodeData) {
      nodeData[key] = value;
      node.setPluginData(DATA_KEYS[`${type}NodeData`], JSON.stringify(nodeData));
      updateLegendEntry(type, id, nodeData);
    }
  }

  /**
   * @description Retrieves a node based on the supplied `id` and uses the `position` to update
   * the node’s stop annotation. Any annotations in the top frame with new numbers are
   * re-painted.
   *
   * @kind function
   * @name updateStopOrder
   *
   * @param {string} type The type of stop data we are updating.
   * @param {string} id The Figma ID of the node containing the stop we are updating.
   * @param {Object} position The position/order of the node containing the stop we are updating.
   *
   * @returns {undefined}
   */
  updateStopOrder(
    type: PluginStopType,
    id: string,
    position: string,
  ) {
    const { messenger, page } = assemble(figma);
    // force the new position into a positive integer
    let newPosition: number = parseInt(position, 10);

    if (!id || !newPosition) {
      messenger.log(`Cannot update ${type}; missing node ID or new position`, 'error');
      return messenger.toast('Unable to locate design node. Please contact Specter dev team.');
    }

    const node: BaseNode = figma.getNodeById(id);
    const frame = node && findTopFrame(node);
    const trackingData = JSON.parse(page.getPluginData(DATA_KEYS[`${type}Annotations`]) || '[]');
    let stopList = JSON.parse(frame.getPluginData(DATA_KEYS[`${type}List`]) || null);

    if (stopList) {
      if (newPosition > stopList.length) {
        newPosition = stopList.length;
      }

      const selectedItem = stopList.find(stopItem => stopItem.id === id);
      const oldPosition = selectedItem.position;

      if (newPosition !== oldPosition) {
        const setPosition = (currentPosition: number, itemId: string): number => {
          if (itemId === id) {
            return newPosition;
          }
          // nodes surrounding the new position node may need to increase or decrease.
          if (currentPosition > oldPosition && currentPosition <= newPosition) {
            if (currentPosition <= newPosition) {
              return (currentPosition - 1);
            }
          } else if (currentPosition >= newPosition) {
            return (currentPosition + 1);
          }
          return currentPosition;
        };

        stopList = stopList.map(item => ({
          id: item.id,
          position: setPosition(item.position, item.id),
        }));
        this.refreshStopListOrder(type, frame, stopList, trackingData);
      }
    }
    App.refreshGUI();
    return null;
  }

  /**
   * @description Refreshes the order of a stop list after a list item has been
   * removed or had its position/order number updated.
   *
   * @kind function
   * @name refreshStopListOrder
   *
   * @param {string} type The type of stop list we are reordering.
   * @param {Object} frame The design frame the list corresponds to.
   * @param {Array} stopList The up-to-date list of stops to reorder.
   * @param {Array} trackingData The up-to-date annotation tracking data.
   *
   * @returns {undefined}
   */
  refreshStopListOrder = (
    type: PluginStopType,
    frame: FrameNode,
    stopList: Array<PluginStopListData>,
    trackingData: Array<PluginNodeTrackingData>,
  ) => {
    const reorderedList = stopList.sort(sortByPosition).map((item, i) => {
      const node = figma.getNodeById(item.id);
      const position = i + 1;
      const nodeData = JSON.parse(node.getPluginData(DATA_KEYS[`${type}NodeData`]));
      node.setPluginData(
        DATA_KEYS[`${type}NodeData`],
        JSON.stringify({ ...nodeData, annotationText: position.toString() }),
      );
      updateAnnotationNum(item.id, position.toString(), trackingData);
      return ({ ...item, position });
    });

    frame.setPluginData(DATA_KEYS[`${type}List`], JSON.stringify(reorderedList));
    refreshLegend(type, frame.id, trackingData, reorderedList);
  }

  /**
   * @description Triggers a UI refresh with the current selection. In the case of the
   * `a11y-keyboard` view context, the necessary data is collected and an object is passed
   * over to the UI thread.
   *
   * @kind function
   * @name refreshGUI
   *
   * @param {boolean} runDiff An optional flag for whether to run a check for unsynced annotations.
   *
   * @returns {null}
   */
  static async refreshGUI(runDiff?: boolean) {
    const { messenger, page, selection } = assemble(figma);

    // retrieve existing options
    const options: PluginOptions = await getOptions();
    const { currentView, isInfo, isMercadoMode } = options;
    const isA11yTab = currentView.includes('a11y-');

    // calculate UI size, based on view type and selection
    let { width, height } = GUI_SETTINGS.default;
    if (currentView === 'general' && isMercadoMode) {
      width = GUI_SETTINGS.mercadoDefault.width;
      height = GUI_SETTINGS.mercadoDefault.height;
    } else if (isA11yTab) {
      width = GUI_SETTINGS.accessibilityDefault.width;
      height = GUI_SETTINGS.accessibilityDefault.height;
    }

    if (selection?.length && runDiff) {
      diffAnnotationLocations(isMercadoMode, messenger, page, selection);
    }

    // ---------- set up selected items bundle for view
    const sessionKey = null; // tktk
    const selectedNodes: Array<SceneNode> = selection;
    const items = [];

    const firstTopFrame = findTopFrame(selection[0]);
    const singleTopFrame = !selection.find(node => findTopFrame(node) !== firstTopFrame);

    if (isA11yTab && singleTopFrame && selection?.length) {
      const type: PluginStopType = getStopTypeFromView(currentView);
      const nodes = getOrderedStopNodes(type, selection, false);

      // this creates the view object of items that is passed over to GUI and used in the views
      nodes.forEach((node: SceneNode) => {
        const { id, name } = node;
        const stopData = getStopData(type, node);
        const displayPosition = stopData.position ? stopData.position.toString() : '';
        const viewObject: PluginViewObject = {
          ...stopData,
          id,
          name,
          isSelected: existsInArray(selectedNodes, node.id),
          position: displayPosition,
        };

        items.push(viewObject);
      });
    }

    figma.ui.postMessage({
      action: 'refreshState',
      payload: {
        currentView,
        isMercadoMode,
        items,
        sessionKey,
      },
    });

    // commit the calculated size (re-size the actual plugin frame)
    if (!isInfo && (!isA11yTab || (isA11yTab && !items.length))) {
      figma.ui.resize(width, height);
    }

    messenger.log(`Updating UI view (${currentView}) with selected nodes'}`);
    return null;
  }

  /**
   * @description Retrieves a node based on the supplied `nodeId` or uses the current selection
   * and removes associated stop annotations and auxilary annotations based on node type.
   *
   * @kind function
   * @name removeStopAnnotation
   *
   * @param {string} type The type of annotation to repair.
   * @param {string} id The `id` of a Figma node with a Keystop annotation.
   * @param {Object} oldFrame An optional arg used to remove a stop from an outdated frame.
   *
   * @returns {undefined} Shows a Toast in the UI if a `nodeId` is not supplied.
   */
  removeStopAnnotation(
    type: PluginStopType,
    id: string,
    oldFrame?: FrameNode,
  ) {
    const { messenger, page } = assemble(figma);

    if (!id) {
      messenger.log(`Cannot remove ${type}; missing node ID(s)`, 'error');
    } else {
      const node: BaseNode = figma.getNodeById(id);
      const frame = oldFrame || findTopFrame(node);
      let trackingData = JSON.parse(page.getPluginData(DATA_KEYS[`${type}Annotations`]) || '[]');
      let stopList = frame && JSON.parse(frame.getPluginData(DATA_KEYS[`${type}List`]) || null);

      removeLinkedAnnotationNodes(trackingData, [id]);
      trackingData = trackingData.filter(entry => entry.id !== id);

      if (stopList) {
        stopList = stopList.filter(item => item.id !== id);
        this.refreshStopListOrder(type, frame, stopList, trackingData);
      }

      page.setPluginData(DATA_KEYS[`${type}Annotations`], JSON.stringify(trackingData));
      App.refreshGUI();
    }
  }

  /**
   * @description Resizes the plugin UI based on either a default, or a provided
   * `bodyHeight` in the `payload` object. The object is sent from the UI thread.
   *
   * @kind function
   * @name resizeGUIHeight
   *
   * @param {Object} payload Should contain `bodyHeight` as the height of the current
   * contents calculated in the UI.
   *
   * @returns {Promise} Returns a promise for resolution.
   */
  static async resizeGUIHeight(
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
   * @description Runs any cleanup actions that need to happen at the beginning of a new
   * session. We use this because Figma’s change watcher for “on close” is not guaranteed
   * to run.
   *
   * @kind function
   * @name runCleanup
   *
   * @returns {Promise} Returns a promise for resolution.
   */
  static async runCleanup() {
    // retrieve existing options
    const options: PluginOptions = await getOptions();

    // set `isInfo` to false
    options.isInfo = false;

    // save new options to storage
    await figma.clientStorage.setAsync(DATA_KEYS.options, options);
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
  static async setViewContext(payload: { newView: PluginViewTypes, skipDiff?: boolean }) {
    const { newView }: { newView: PluginViewTypes } = payload;

    // retrieve existing options
    const options: PluginOptions = await getOptions();

    // set new view without changing other options
    options.currentView = newView;

    // save new options to storage
    await figma.clientStorage.setAsync(DATA_KEYS.options, options);

    // refresh the view
    App.refreshGUI(!payload.skipDiff);
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
   * @description Resizes the plugin GUI depending on whether we are showing or hiding
   * the info panel. The resize is delayed via timeout to give the UI thread a chance to
   * show/hide some UI elements. The current state of the info panel (shown or hidden) is
   * saved to the plugin options as `isInfo`.
   *
   * @kind function
   * @name showHideInfo
   *
   * @param {boolean} show Whether to show or hide the info panel. The default is `true`.
   *
   * @returns {Promise} Returns a promise for resolution.
   */
  static async showHideInfo(
    show: boolean = true,
  ) {
    // retrieve existing options
    const options: PluginOptions = await getOptions();

    // set some local options
    let action = 'showInfo';
    let timingDelay = 190;
    let newIsInfo = true;

    if (!show) {
      action = 'hideInfo';
      timingDelay = 180;
      newIsInfo = false;
    }

    setTimeout(() => {
      if (show) {
        resizeGUI('info', figma.ui);
      } else {
        // let refresh determine size using plugin options for current view
        App.refreshGUI();
      }
    }, timingDelay);

    // switch views
    figma.ui.postMessage({
      action,
    });

    // set `isInfo` in the options
    options.isInfo = newIsInfo;

    // save new options to storage
    await figma.clientStorage.setAsync(DATA_KEYS.options, options);
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

    await App.refreshGUI(true);
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
}
