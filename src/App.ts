import Crawler from './Crawler';
import Identifier from './Identifier';
import Messenger from './Messenger';
import Painter from './Painter/Painter';
import {
  deepCompare,
  existsInArray,
  findTopFrame,
  getPeerPluginData,
  lettersToNumbers,
  numberToLetters,
  resizeGUI,
  sortByPosition,
  updateArray,
} from './Tools';
import {
  getFrameAnnotatedNodes,
  getOrderedStopNodes,
} from './appHelpers/nodeGetters';
import { DATA_KEYS, GUI_SETTINGS } from './constants';


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
  const { selection } = context.currentPage;
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
 * @description Checks the tracking data for the legend and removes any legend records
 * that are out of sync.  They will be rebuilt once the method to fix node links runs.
 *
 * @kind function
 * @name checkLegendLink
 *
 * @param {Object} page The type page the selections are on.
 * @param {Object} frame The top frame for the selection.
 * @param {Object} trackingData The page-level legend tracking data.
 *
 * @returns {undefined}
 */
const checkLegendLink = (
  page: PageNode,
  frame: FrameNode,
  trackingData: Array<PluginFrameTrackingData>,
): void => {
  const frameLinkData: PluginFrameLinkData = JSON.parse(
    frame.getPluginData(DATA_KEYS.legendLinkId) || null,
  );
  if (frameLinkData?.role === 'frame') {
    const trackingEntry = trackingData.find(entry => entry.linkId === frameLinkData.id);
    if (trackingEntry && trackingEntry.id !== frame.id) {
      // likely this frame was copied, possibly with the legend
      const orphanedLegend = page.children.find((child) => {
        const childLinkData = JSON.parse(child.getPluginData(DATA_KEYS.legendLinkId) || null);
        return (
          childLinkData?.role === 'legend'
          && childLinkData?.id === frameLinkData.id
          && !trackingData.map(entry => entry.legendId).includes(child.id)
        );
      });
      if (orphanedLegend) {
        orphanedLegend.remove(); // remove as a new one will build
      }
      frame.setPluginData(DATA_KEYS.legendLinkId, JSON.stringify(null));
    }
  }
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
 * @name repairBrokenLinks
 *
 * @param {string} type The type of annotation to repair (`keystop` or `label`).
 * @param {Object} options Includes `frameNode`: a top frame node to evaluate for context;
 * `trackingData`: the page-level node tracking data; `page`: the Figma PageNode;
 * `messenger`: an initialized instance of the Messenger class for logging; and
 * `isMercadoMode`: designates whether “Mercado” rules apply.
 *
 * @returns {null}
 */
const repairBrokenLinks = (
  type: PluginStopType,
  options: {
    isMercadoMode: boolean,
    messenger: any,
    page: PageNode,
    frame: FrameNode,
    trackingData: Array<PluginNodeTrackingData>,
  },
): void => {
  // ----- remove annotations with broken links
  const {
    isMercadoMode,
    page,
    messenger,
    frame,
    trackingData,
  } = options;
  const frameCrawler = new Crawler({ for: [frame] });
  const frameNodes = frameCrawler.all();

  const annotationNodesToRemove: Array<string> = [];

  const list: Array<{
    id: string,
    position: number,
  }> = JSON.parse(frame.getPluginData(DATA_KEYS[`${type}List`]) || null);

  if (list) {
    const updatedList = list;
    let updatesMade = false;

    // find nodes that do not match the tracking data
    frameNodes.forEach((node) => {
      const nodeLinkData: PluginNodeLinkData = JSON.parse(
        node.getPluginData(DATA_KEYS[`${type}LinkId`]) || null,
      );
      if (nodeLinkData && nodeLinkData.role === 'node') {
        const matchingData = trackingData.find(
          data => (data.linkId === nodeLinkData.id),
        );
        if (
          matchingData
          && (matchingData.id !== node.id || matchingData.topFrameId !== frame.id)
        ) {
          // final check; make sure node that corresponds to the annotation does not
          // actually exist within the current top frame.
          const existingNode: SceneNode = frame.findOne(
            frameChild => frameChild.id === matchingData.id,
          );
          if (!existingNode) {
            // all checks pass; delete the annotation node
            annotationNodesToRemove.push(matchingData.linkId);
            // updatesMade = true;

            // find the index of a pre-existing `id` match on the array
            const itemIndex: number = updatedList.findIndex(
              foundItem => (foundItem.id === matchingData.id),
            );

            // if a match exists, update the id
            if (itemIndex > -1) {
              updatedList[itemIndex].id = node.id;
            }
          }
        }
      }
    });

    // find annotation nodes that match the nodes to be removed and remove them
    frameNodes.forEach((node) => {
      // need to re-check for a node's existence since we are deleting as we go
      const activeNode: BaseNode = figma.getNodeById(node.id);
      if (activeNode) {
        const nodeLinkData: PluginNodeLinkData = JSON.parse(
          activeNode.getPluginData(DATA_KEYS[`${type}LinkId`]) || null,
        );
        if (nodeLinkData && nodeLinkData.role === 'annotation') {
          if (annotationNodesToRemove.includes(nodeLinkData.id)) {
            // remove annotation
            activeNode.remove();

            // set flag
            updatesMade = true;
          }
        }
      }
    });

    // if updates were made, we need reset the stop list and re-paint annotations
    if (updatesMade) {
      // re-assign stop with Identifier
      const nodesToReannotate: Array<string> = [];
      updatedList.forEach((listEntry) => {
        // flag node for repainting
        if (!nodesToReannotate.includes(listEntry.id)) {
          nodesToReannotate.push(listEntry.id);
        }
      });

      // reset the list
      frame.setPluginData(
        DATA_KEYS[`${type}List`],
        JSON.stringify([]),
      );

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

// removes a node, if it exists
const removeNode = (nodeId: string, legendNodeId: string) => {
  const nodeToRemove: BaseNode = figma.getNodeById(nodeId);
  if (nodeToRemove) {
    nodeToRemove.remove();

    const legendNodeToRemove: BaseNode = legendNodeId && figma.getNodeById(legendNodeId);

    if (legendNodeToRemove) {
      legendNodeToRemove.remove();
    }
  }
};

// full cleanup; removes annotation + tracking data + resets topFrame list
const fullCleanup = (
  trackingEntry: PluginNodeTrackingData,
  initialTrackingData: Array<PluginNodeTrackingData>,
  options: {
    isMercadoMode: boolean,
    messenger: any,
    page: PageNode,
  },
  type: PluginStopType,
): {
  newTrackingData: Array<PluginNodeTrackingData>,
  newNodesToRepaint: Array<string>,
} => {
  const newNodesToRepaint: Array<string> = [];

  // remove annotation and legend nodes
  removeNode(trackingEntry.annotationId, trackingEntry.legendItemId);

  // --- remove from tracking data
  let newTrackingData = initialTrackingData;
  newTrackingData = updateArray(newTrackingData, trackingEntry, 'id', 'remove');

  // --- re-order (and potentially re-paint) annotations on the original top frame
  // remove from topFrame list + trigger re-paint
  const topFrameNode: FrameNode = figma.getNodeById(trackingEntry.topFrameId) as FrameNode;
  if (topFrameNode) {
    // get top frame stop list
    const list = JSON.parse(topFrameNode.getPluginData(DATA_KEYS[`${type}List`]) || null);

    if (list) {
      // get current position
      let positionToRemove: number = 1;
      const entryToRemove = list.find(
        listEntry => listEntry.id === trackingEntry.id,
      );
      if (entryToRemove) {
        positionToRemove = entryToRemove.position;
      }

      // remove item
      let newList = list;
      newList = updateArray(newList, trackingEntry, 'id', 'remove');

      // renumber list
      newList.forEach((listEntry) => {
        if (listEntry.position > positionToRemove) {
          const updatedEntry = listEntry;
          updatedEntry.position -= 1;
          newList = updateArray(newList, updatedEntry, 'id', 'update');

          // set up Identifier instance for the node
          const nodeToUpdate: BaseNode = figma.getNodeById(listEntry.id);
          const { page, isMercadoMode, messenger } = options;
          if (nodeToUpdate) {
            const identifier = new Identifier({
              for: nodeToUpdate,
              data: page,
              isMercadoMode,
              messenger,
            });

            // get/set the stop info
            const identifierResult = identifier.getSetStop(type, updatedEntry.position);
            options.messenger.handleResult(identifierResult, true);

            if (identifierResult.status === 'success') {
              // flag node for repainting
              if (!newNodesToRepaint.includes(updatedEntry.id)) {
                newNodesToRepaint.push(updatedEntry.id);
              }

              // remove existing annotation node
              const annotationToRemoveEntry = newTrackingData.find(
                currentTrackingEntry => currentTrackingEntry.id === updatedEntry.id,
              );
              if (annotationToRemoveEntry) {
                removeNode(
                  annotationToRemoveEntry.annotationId,
                  annotationToRemoveEntry.legendItemId,
                );
              }
            }
          }
        }
      });

      // set new stop list
      topFrameNode.setPluginData(
        DATA_KEYS[`${type}List`],
        JSON.stringify(newList),
      );
    }
  }

  const results = {
    newTrackingData,
    newNodesToRepaint,
  };

  return results;
};

/**
 * @description Checks tracking data against the provided frameNode. If any annotations
 * are missing, they are re-painted. If any links are broken/invalidated, annotations are removed.
 *
 * @kind function
 * @name refreshAnnotations
 *
 * @param {string} type The type of annotation to repair (`keystop` or `label`).
 * @param {Object} options Includes `trackingData`: the page-level node tracking data;
 * `page`: the Figma PageNode; `messenger`: an initialized instance of the Messenger class for
 * logging; and `isMercadoMode`: designates whether “Mercado” rules apply.
 *
 * @returns {null}
 */
const refreshAnnotations = (
  type: PluginStopType,
  options: {
    isMercadoMode: boolean,
    trackingData: Array<PluginNodeTrackingData>,
    messenger: any,
    page: PageNode,
  },
): void => {
  const {
    isMercadoMode,
    trackingData,
    messenger,
    page,
  } = options;

  let updatedTrackingData: Array<PluginNodeTrackingData> = trackingData;
  const nodesToRepaint: Array<string> = [];

  trackingData.forEach((trackingEntry) => {
    const node: BaseNode = figma.getNodeById(trackingEntry.id);

    // ----- check if main node still exists
    if (node) {
      const topFrame: FrameNode = findTopFrame(node);

      // ----- check if topFrame is still the same
      if (topFrame && topFrame.id === trackingEntry.topFrameId) {
        // grab the position from crawler
        const crawler = new Crawler({ for: [node] });
        const positionResult = crawler.position();
        const relativePosition = positionResult.payload;

        // group and position the base annotation elements
        const currentNodePosition: PluginNodePosition = {
          frameWidth: topFrame.width,
          frameHeight: topFrame.height,
          width: relativePosition.width,
          height: relativePosition.height,
          x: relativePosition.x,
          y: relativePosition.y,
        };

        // ----- check if position has changed
        if (deepCompare(currentNodePosition, trackingEntry.nodePosition)) {
          // ---- something about position is different; repaint
          // remove annotation node
          removeNode(trackingEntry.annotationId, trackingEntry.legendItemId);

          // queue for repaint
          if (!nodesToRepaint.includes(node.id)) {
            nodesToRepaint.push(node.id);
          }
        } else {
          const annotationNode: BaseNode = figma.getNodeById(trackingEntry.annotationId);

          // ----- check if annotation node is still there
          if (!annotationNode) {
            // ----- annotation is missing; repaint
            if (!nodesToRepaint.includes(node.id)) {
              nodesToRepaint.push(node.id);
            }
          }
        }
      } else {
        // ----- top frame has changed; remove annotation + re-order and re-paint remaining nodes
        //   --- add annotation within new top frame, if applicable

        // --- clean up and re-paint existing top frame
        const cleanupResults = fullCleanup(
          trackingEntry,
          updatedTrackingData,
          options,
          type,
        );

        updatedTrackingData = cleanupResults.newTrackingData;
        cleanupResults.newNodesToRepaint.forEach((nodeId) => {
          if (!nodesToRepaint.includes(nodeId)) {
            nodesToRepaint.push(nodeId);
          }
        });

        // --- add the moved annotation to the new top frame
        const identifier = new Identifier({
          for: node,
          data: page,
          isMercadoMode,
          messenger,
        });

        // get/set the stop info
        const identifierResult = identifier.getSetStop(type);

        if (identifierResult.status === 'success') {
          // flag node for repainting
          if (!nodesToRepaint.includes(node.id)) {
            nodesToRepaint.push(node.id);
          }
        } else if (!nodesToRepaint.includes(node.id)) {
          nodesToRepaint.push(node.id);
        }
      }
    } else {
      // ----- node is missing; remove annotation + re-order and re-paint remaining nodes

      // --- clean up and re-paint existing top frame
      const cleanupResults = fullCleanup(
        trackingEntry,
        updatedTrackingData,
        options,
        type,
      );

      updatedTrackingData = cleanupResults.newTrackingData;
      cleanupResults.newNodesToRepaint.forEach((nodeId) => {
        if (!nodesToRepaint.includes(nodeId)) {
          nodesToRepaint.push(nodeId);
        }
      });
    }
  });

  // update the tracking data
  page.setPluginData(
    DATA_KEYS[`${type}Annotations`],
    JSON.stringify(updatedTrackingData),
  );

  // ----- repaint queued nodes
  nodesToRepaint.forEach((nodeId) => {
    const nodeToRepaint: BaseNode = figma.getNodeById(nodeId);

    if (nodeToRepaint) {
      // set up Painter instance for the node
      const painter = new Painter({
        for: nodeToRepaint,
        in: page,
        isMercadoMode,
      });

      // re-draw the annotation
      const painterResult = painter.addStop(type);
      messenger.handleResult(painterResult, true);

      if (painterResult.status === 'error') {
        // we need to track nodes that previously had annotations;
        // re-add them if they’re currently placed off-artboard on the page
        const topFrame: FrameNode = findTopFrame(nodeToRepaint);
        if (
          (!topFrame && nodeToRepaint.parent.type === 'PAGE')
          || (topFrame && topFrame.parent.type === 'PAGE')
        ) {
          // `findTopFrame` returns self if the parent is the page
          // set up new tracking data node entry
          const nodeToTrack: SceneNode = nodeToRepaint as SceneNode;
          const currentNodePosition: PluginNodePosition = {
            frameWidth: null,
            frameHeight: null,
            width: nodeToTrack.width,
            height: nodeToTrack.height,
            x: nodeToTrack.x,
            y: nodeToTrack.y,
          };
          const freshTrackingEntry: PluginNodeTrackingData = {
            annotationId: null,
            id: nodeToTrack.id,
            linkId: null,
            topFrameId: nodeToRepaint.parent.id,
            nodePosition: currentNodePosition,
          };

          // grab latest tracking data for the page; add the entry to the array
          const freshTrackingData: Array<PluginNodeTrackingData> = JSON.parse(
            page.getPluginData(DATA_KEYS[`${type}Annotations`]) || '[]',
          );
          let newFreshTrackingData: Array<PluginNodeTrackingData> = freshTrackingData;
          newFreshTrackingData = updateArray(newFreshTrackingData, freshTrackingEntry, 'id', 'add');

          // update the tracking data
          page.setPluginData(
            DATA_KEYS[`${type}Annotations`],
            JSON.stringify(newFreshTrackingData),
          );
        }
      }
    }
  });

  return null;
};

/**
 * @description Compares current tracking data for Keystop and Label nodes against the nodes
 * themselves. If the nodes have changed size/position, we update the node’s corresponding
 * annotation. If the node has not changed, but its annotation is missing, we re-paint it.
 *
 * @kind function
 * @name diffChanges
 *
 * @param {string} type The type of annotations to diff. Currently: `keystop` or `label`.
 * @param {Object} options An options bundle that contains the current `selection`, current `page`,
 * an initiated `messenger`, and the `isMercadoMode` boolean.
 *
 * @returns {null}
 */
const diffChanges = (
  type: PluginStopType,
  options: {
    isMercadoMode: boolean,
    messenger: any,
    page: PageNode,
    selection: Array<any>,
  },
) => {
  const {
    isMercadoMode,
    messenger,
    page,
    selection,
  } = options;

  // grab tracking data for the page (currently Keystops/Labels)
  const annotationsDataType = DATA_KEYS[`${type}Annotations`];
  const trackingData: Array<PluginNodeTrackingData> = JSON.parse(
    page.getPluginData(annotationsDataType) || '[]',
  );
  const legendTrackingData: Array<PluginFrameTrackingData> = JSON.parse(
    page.getPluginData(DATA_KEYS.legendFrames) || '[]',
  );

  // iterate through each node in a selection
  const selectedNodes: Array<SceneNode> = selection;
  // determine topFrames involved in the current selection
  const crawlerForSelected = new Crawler({ for: selectedNodes });
  const topFrameNodes: Array<FrameNode> = crawlerForSelected.topFrames();

  // check the links between frames and legend frames (removes unsynced)
  topFrameNodes.forEach((topFrame) => {
    checkLegendLink(page, topFrame, legendTrackingData);
  });

  // re-draw broken/moved annotations and clean up orphaned (currently only Keystops)
  const refreshOptions = {
    trackingData,
    legendTrackingData,
    page,
    messenger,
    isMercadoMode,
  };
  refreshAnnotations(type, refreshOptions);

  // look for nodes/annotations that no longer match their topFrame and repair
  // (this happens when copying a top-frame)
  topFrameNodes.forEach((topFrame: FrameNode) => {
    const repairOptions = {
      messenger,
      isMercadoMode,
      page,
      frame: topFrame,
      trackingData,
    };
    repairBrokenLinks(type, repairOptions);
  });

  return null;
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
 * @param {string} type The type of annotation to repair (`keystop` or `label`).
 * @param {Object} node A SceneNode to check for Keystop data.
 *
 * @returns {Object} An object formatted for the UI including `hasStop`, a boolean indicating
 * the presence of a keystop, the current position if the stop exists, and any keys (as an array),
 * if they exist or labels (if they exist).
 */
const getStopData = (
  type: PluginStopType,
  node: SceneNode,
): {
  hasStop: boolean,
  keys?: Array<PluginKeystopKeys>,
  labels?: PluginAriaLabels,
  position: number,
  role?: string,
} => {
  // set up keystop blank
  const nodePositionData: {
    hasStop: boolean,
    keys?: Array<PluginKeystopKeys>,
    labels?: PluginAriaLabels,
    position: number,
    role?: string,
  } = {
    hasStop: false,
    keys: null,
    labels: null,
    position: null,
    role: null,
  };

  // find data for selected node
  const nodeData = JSON.parse(node.getPluginData(DATA_KEYS[`${type}NodeData`]) || '{}');

  // set data for each field (will only set what it grabs based on type)
  ['keys', 'role', 'labels'].forEach((property) => {
    if (nodeData[property]) {
      nodePositionData[property] = nodeData[property];
    }
  });

  // find top frame for selected node
  const crawler = new Crawler({ for: [node] });
  const topFrame = crawler.topFrame();
  if (topFrame) {
    // read stop list data from top frame
    const stopList = JSON.parse(topFrame.getPluginData(DATA_KEYS[`${type}List`]) || null);
    const stopItem = stopList?.find(item => item.id === node.id);
    if (stopItem) {
      nodePositionData.hasStop = true;
      nodePositionData.position = stopItem.position;
    }
  }

  return nodePositionData;
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
   * focus order keystop annotations or Aria label annotations.  Removed any existing annotations
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
   * @returns {null} Shows a Toast in the UI if nothing is selected.
   */
  async annotateStops(
    type: PluginStopType,
    suppliedNodes?: Array<SceneNode>,
  ) {
    const {
      messenger,
      page,
      selection,
    } = assemble(figma);

    // need a selected node to annotate it
    if (!selection?.length && !suppliedNodes?.length) {
      messenger.log(`Annotate ${type}: nothing selected`);
      return messenger.toast('A layer must be supplied');
    }

    // get list of nodes in order (already annotated, has Stapler data, selected)
    const nodesToAnnotate: Array<SceneNode> = getOrderedStopNodes(selection, suppliedNodes, type);

    // grab tracking data for the page
    const trackingData: Array<PluginNodeTrackingData> = JSON.parse(
      page.getPluginData(DATA_KEYS[`${type}Annotations`]) || '[]',
    );

    // re-paint the annotations
    nodesToAnnotate.forEach((node: SceneNode) => {
      // remove existing annotation
      removeLinkedAnnotationNodes(trackingData, [node.id]);

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
          paintResult = painter.addStop(type);
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

      // get/set the stop info
      const identifierResult = identifier.getSetStop(type);

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
   * @description Retrieves a node based on the supplied `id` and draws an auxilarly Key Annotation
   * based on the supplied `key`.
   *
   * @kind function
   * @name updateNodeDataKeys
   *
   * @param {Object} options Should include a Figma node `id` and the `key` to be added.
   * @param {boolean} removeKey Default is `false`. If set to `true`, the list of keystops will not
   * be re-painted after an update, effectively removing the annotation that corresponds to the
   * supplied `id` in `options`.
   *
   * @returns {null}
   */
  updateNodeDataKeys(
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
      this.annotateStops('keystop', [node as SceneNode]);
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
   * @description Retrieves a node based on the supplied `id` and updates the `role` or text
   * `labels` based on input from the UI.
   *
   * @kind function
   * @name updateNodeDataLabels
   *
   * @param {string} key The type of data to set (`role` or `labels`). Used as a `key` on
   * the `nodeData` object.
   * @param {Object} options Should include a Figma node `id` and optionally the `role`
   * or `labels` to be updated.
   *
   * @returns {null}
   */
  updateNodeDataLabels(
    key: 'role' | 'labels',
    options: {
      id: string,
      labels?: PluginAriaLabels,
      role?: PluginLabelRole,
    },
  ) {
    const { id } = options;
    const node: BaseNode = figma.getNodeById(id);

    if (node) {
      // retrieve the node data
      const nodeData = JSON.parse(node.getPluginData(DATA_KEYS.labelNodeData) || null);
      if (nodeData) {
        nodeData[key] = options[key];
        node.setPluginData(
          DATA_KEYS.labelNodeData,
          JSON.stringify(nodeData),
        );
      }

      // repaint the node in the legend with the updated data
      this.annotateStops('label', [node as SceneNode]);
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
   * @description Retrieves a node based on the supplied `id` and uses the `position` to update
   * the node’s stop annotation. Any annotations in the top frame with new numbers are
   * re-painted.
   *
   * @kind function
   * @name updateStopAnnotation
   *
   * @param {string} type The type of stop data we are updating.
   * @param {string} id The Figma ID of the node containing the stop we are updating.
   * @param {Object} position The position of the node containing the stop we are updating.
   *
   * @returns {null}
   */
  updateStopAnnotation(
    type: PluginStopType,
    id: string,
    position: string,
  ) {
    const { messenger } = assemble(figma);

    // force the new position into a positive integer
    let newPosition: number = parseInt(position, 10);
    if (newPosition.toString() === 'NaN') {
      newPosition = lettersToNumbers(position);
    }

    if (!id || !newPosition) {
      messenger.log(`Cannot update ${type}; missing node ID or new position`, 'error');
    }

    const nodesToRepaint: Array<SceneNode> = [];
    let nodes: Array<BaseNode> = [];
    const node: BaseNode = figma.getNodeById(id);
    if (node) {
      nodes = [node];
    }

    // determine topFrames involved in the current selection
    const crawler = new Crawler({ for: nodes });
    const topFrameNodes: Array<FrameNode> = crawler.topFrames();

    // iterate topFrames and remove annotation(s) that match node(s)
    topFrameNodes.forEach((frameNode: FrameNode) => {
      // read stop list data from top frame
      const stopList: Array<{
        id: string,
        position: number,
      }> = JSON.parse(frameNode.getPluginData(DATA_KEYS[`${type}List`]) || null);

      // remove item(s) from the stop list
      let newStopList = [];
      if (stopList) {
        // number items
        const numberItems = stopList.length;

        // validate and adjust based on actual number of items
        if (newPosition > numberItems) {
          newPosition = numberItems;
        }

        // find the old position
        const selectedItem = stopList.find(stopItem => stopItem.id === id);
        const oldPosition = selectedItem.position;

        // compare new/old positions and, if applicable, set up the new list
        if (newPosition === oldPosition) {
          // do nothing if the positions match
          newStopList = stopList;
        } else {
          const setPosition = (currentPosition: number, itemId: string): number => {
            // the selected node always gets the new position
            if (itemId === id) {
              return newPosition;
            }

            // how we manipulate the new position is based on relationship to the
            // _selected_ node’s old position:
            //
            // nodes higher in the list relative to the old position may need to be moved lower;
            // nodes lower in the list relative to the old position may need to be moved higher.
            if (currentPosition > oldPosition && currentPosition <= newPosition) {
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
          stopList.forEach((stopItem) => {
            // stub in new entry based on old values
            const newItemEntry = {
              id: stopItem.id,
              position: setPosition(stopItem.position, stopItem.id),
            };

            newStopList.push(newItemEntry);
          });
        }
      }

      // sort the new list by position
      newStopList = newStopList.sort(sortByPosition);

      // commit the new stop list
      frameNode.setPluginData(
        DATA_KEYS[`${type}List`],
        JSON.stringify(newStopList),
      );

      // use the new, sorted list to select the original nodes in figma
      newStopList.forEach((stopItem) => {
        const itemNode: BaseNode = figma.getNodeById(stopItem.id);
        if (itemNode) {
          nodesToRepaint.push(itemNode as SceneNode);
        }
      });
    });

    // repaint affected nodes
    this.annotateStops(type, nodesToRepaint);

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
    const {
      currentView,
      isInfo,
      isMercadoMode,
    } = options;

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

    // ---------- track and re-draw annotations for nodes that have moved/changed/damaged
    // currently we only track/repair for Labels and Keystops
    const diffChangesFor: Array<PluginStopType> = ['keystop', 'label'];
    const diffChangesOptions = {
      isMercadoMode,
      messenger,
      page,
      selection,
    };
    diffChangesFor.forEach(diffType => diffChanges(diffType, diffChangesOptions));

    // ---------- set up selected items bundle for view
    const nodes: Array<SceneNode> = [];
    const sessionKey = null; // tktk
    const selectedNodes: Array<SceneNode> = selection;

    // determine topFrames involved in the current selection
    const crawlerForSelected = new Crawler({ for: selectedNodes });
    const topFrameNodes: Array<FrameNode> = crawlerForSelected.topFrames();

    const items: Array<{
      id: string,
      name: string,
      position?: number | string,
      hasStop: boolean,
      isSelected: boolean,
      keys?: Array<PluginKeystopKeys>,
    }> = [];

    // specific to `a11y-keyboard` and `a11y-labels`
    if ((currentView === 'a11y-keyboard') || (currentView === 'a11y-labels')) {
      const nodeType = currentView === 'a11y-keyboard' ? 'keystop' : 'label';

      // iterate topFrames and select nodes that already have annotations
      topFrameNodes.forEach((topFrame: FrameNode) => {
        const getStopOptions = {
          frame: topFrame,
          resetData: false,
        };
        const stopNodes: Array<SceneNode> = getFrameAnnotatedNodes(nodeType, getStopOptions);
        stopNodes.forEach(stopNode => nodes.push(stopNode));
      });

      // iterate topFrames and select nodes that could have stops based on assignment data
      topFrameNodes.forEach((topFrame: FrameNode) => {
        const extractAssignedKeystops = (children) => {
          const crawlerForChildren = new Crawler({ for: children });
          const childNodes = crawlerForChildren.all();
          childNodes.forEach((childNode) => {
            const peerNodeData = getPeerPluginData(childNode);
            if (peerNodeData && peerNodeData.hasKeystop) {
              if (
                !existsInArray(nodes, childNode.id)
                && !existsInArray(topFrameNodes, childNode.id)
              ) {
                nodes.push(childNode);
                if (peerNodeData.allowKeystopPassthrough && childNode.children) {
                  extractAssignedKeystops(childNode.children);
                }
              }
            }
          });
        };

        if (topFrame.children) {
          extractAssignedKeystops(topFrame.children);
        }
      });

      // add in any directly-selected nodes that do not have annotations yet
      selectedNodes.forEach((node: SceneNode) => {
        if (
          !existsInArray(nodes, node.id)
          && !existsInArray(topFrameNodes, node.id)
          && (node.parent && node.parent.type !== 'PAGE')
        ) {
          nodes.push(node);
        }
      });

      // this creates the view object of items that is passed over to GUI and used in the views
      nodes.forEach((node: SceneNode) => {
        const { id, name } = node;
        const {
          hasStop,
          keys,
          role,
          labels,
          position,
        } = getStopData(nodeType, node);

        let displayPosition: string = position ? position.toString() : '';
        if (currentView === 'a11y-labels') {
          // convert numeric position to alpha for view
          displayPosition = numberToLetters(position);
        }
        const viewObject: PluginViewObject = {
          id,
          name,
          isSelected: existsInArray(selectedNodes, node.id),
          hasStop,
          keys,
          role,
          labels,
          position: displayPosition,
        };

        items.push(viewObject);
      });
    } else {
      nodes.forEach((node: SceneNode) => {
        const { id, name } = node;
        const viewObject = {
          hasStop: false,
          id,
          isSelected: true,
          name,
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
      },
    });

    // commit the calculated size (re-size the actual plugin frame)
    if (
      ((currentView !== 'a11y-keyboard') && (currentView !== 'a11y-labels'))
      || (((currentView === 'a11y-keyboard') || (currentView === 'a11y-labels')) && items.length < 1)
    ) {
      // no need to resize if the info panel is open
      if (!isInfo) {
        figma.ui.resize(
          width,
          height,
        );
      }
    }

    messenger.log(`Updating UI view (${currentView}) with ${nodes.length} selected ${nodes.length === 1 ? 'node' : 'nodes'}`);
    return null;
  }

  /**
   * @description Retrieves a node based on the supplied `nodeId` or uses the current selection
   * and removes associated stop annotations and auxilary annotations based on node type
   * (currently `keystop` or `label`).
   *
   * @kind function
   * @name removeStopAnnotation
   *
   * @param {string} type The type of annotation to repair (`keystop` or `label`).
   * @param {string} id The `id` of a Figma node with a Keystop annotation.
   *
   * @returns {null} Shows a Toast in the UI if a `nodeId` is not supplied.
   */
  async removeStopAnnotation(
    type: PluginStopType,
    id?: string,
  ) {
    const {
      messenger,
      page,
      selection,
    } = assemble(figma);

    // can’t do anything without nodes to manipulate
    if (!id && selection.length < 1) {
      messenger.log(`Cannot remove ${type}; missing node ID(s)`, 'error');
    }

    const nodesToRepaint: Array<SceneNode> = [];
    let nodes = selection;
    if (id) {
      const node: BaseNode = figma.getNodeById(id);
      if (node) {
        nodes = [node];
      }
    }

    // determine topFrames involved in the current selection
    const crawler = new Crawler({ for: nodes });
    const topFrameNodes: Array<FrameNode> = crawler.topFrames();

    // grab tracking data for the page
    const trackingData: Array<PluginNodeTrackingData> = JSON.parse(
      page.getPluginData(DATA_KEYS[`${type}Annotations`]) || '[]',
    );

    // iterate topFrames and remove annotation(s) that match node(s)
    topFrameNodes.forEach((frameNode: FrameNode) => {
      // read stop list data from top frame
      const stopList: Array<{
        id: string,
        position: number,
      }> = JSON.parse(frameNode.getPluginData(DATA_KEYS[`${type}List`]) || null);

      // remove item(s) from the stop list and tracking data
      let newStopList = stopList;
      let newTrackingData = trackingData;
      if (stopList) {
        nodes.forEach((node) => {
          newStopList = updateArray(newStopList, node, 'id', 'remove');
          newTrackingData = updateArray(newTrackingData, node, 'id', 'remove');
        });
      }

      // set new stop list
      frameNode.setPluginData(
        DATA_KEYS[`${type}List`],
        JSON.stringify(newStopList),
      );

      // set new tracking data
      page.setPluginData(
        DATA_KEYS[`${type}Annotations`],
        JSON.stringify(newTrackingData),
      );

      // use the new, sorted list to select the original nodes in figma
      newStopList.forEach((stopItem) => {
        const itemNode: BaseNode = figma.getNodeById(stopItem.id);
        if (itemNode) {
          nodesToRepaint.push(itemNode as SceneNode);
        }
      });
    });

    // remove the corresponding annotations
    const nodeIds: Array<string> = nodes.map(node => node.id);
    removeLinkedAnnotationNodes(trackingData, nodeIds);

    // repaint affected nodes
    if (nodesToRepaint.length) {
      this.annotateStops(type, nodesToRepaint);
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
}
