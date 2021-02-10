import { CONTAINER_NODE_TYPES, DATA_KEYS } from '../constants';
import { existsInArray, getPeerPluginData } from '../Tools';
import Crawler from '../Crawler';

/**
 * @description Reverse iterates the node tree to determine the immediate parent component instance
 * (if one exists) for the node.
 *
 * @kind function
 * @name findParentInstance
 *
 * @param {Object} node A Figma node object (`SceneNode`).
 *
 * @returns {Object} Returns the top component instance (`InstanceNode`) or `null`.
 */
const findParentInstance = (node: any) => {
  let { parent } = node;
  let currentNode = node;
  let currentTopInstance: InstanceNode = null;

  // return self if already typed as instance
  if (currentNode.type === CONTAINER_NODE_TYPES.instance) {
    currentTopInstance = currentNode;
    return currentTopInstance;
  }

  if (parent) {
    // return immediate parent if already typed as instance
    if (parent.type === CONTAINER_NODE_TYPES.instance) {
      currentTopInstance = parent;
      return currentTopInstance;
    }

    // iterate until the parent is an instance
    while (parent && parent.type !== CONTAINER_NODE_TYPES.instance) {
      currentNode = parent;
      if (currentNode.parent.type === CONTAINER_NODE_TYPES.instance) {
        // update the top-most instance component with the current one
        currentTopInstance = currentNode.parent;
      }
      parent = currentNode.parent;
    }
  }

  return currentTopInstance;
};

/**
 * @description Takes a frame and uses it's tracking data to find and return
 * a corresponding legend frame if it exists.
 *
 * @kind function
 * @name findLegendFrame
 * @param {Object} frameId The design top frame we're looking for a legend for.
 * @param {Object} page The Figma page the frame belongs to.
 *
 * @returns {Object} The legend for the frame (or null, if it doesn't exist).
 */
const findLegendFrame = (frameId: string, page: PageNode) => {
  let legendFrame = null;
  const frameTrackingData = JSON.parse(page.getPluginData(DATA_KEYS.legendFrames) || '[]');
  const trackingEntry = frameTrackingData.find(entry => entry.id === frameId);

  if (trackingEntry?.legendId) {
    legendFrame = figma.getNodeById(trackingEntry.legendId);
  }
  return legendFrame;
};

/**
 * @description Checks all page children for a child that has an assigned role of legend
 * and matching link ID, but is not yet listed in our tracking data.
 *
 * @kind function
 * @name findOrphanedLegendFrame
 *
 * @param {Object} page The type page the selections are on.
 * @param {Array} trackingData The page-level legend tracking data.
 * @param {string} frameLinkId The shared linkId originally assigned to the frame and legend.
 *
 * @returns {Object} The frame/page child that matches our criteria for a matching orphaned legend.
 */
const findOrphanedLegendFrame = (
  page: PageNode,
  trackingData: Array<PluginFrameTrackingData>,
  frameLinkId: string,
) => {
  const match = page.children.find((child) => {
    const childLinkData = JSON.parse(child.getPluginData(DATA_KEYS.legendLinkId) || null);
    const isMatch = childLinkData?.role === 'legend'
      && childLinkData?.id === frameLinkId
      && !trackingData.map(entry => entry.legendId).includes(child.id);
    return isMatch;
  }) as FrameNode;
  return match;
};

/**
 * @description Reverse iterates the node tree to determine the top-level component
 * (if one exists) for the node. This allows you to check if a node is part of a component.
 *
 * @kind function
 * @name findTopComponent
 *
 * @param {Object} node A Figma node object (`SceneNode`).
 *
 * @returns {Object} Returns the component (`ComponentNode`) or `null`.
 */
const findTopComponent = (node: any) => {
  // return self if component
  if (node.type === CONTAINER_NODE_TYPES.component) {
    return node;
  }

  let { parent } = node;
  let currentNode = node;
  let componentNode: ComponentNode = null;
  if (parent) {
    // iterate until the parent is a page or component is found;
    // components cannot nest inside other components, so we can stop at the first
    // found component
    while (parent && parent.type !== 'PAGE' && componentNode === null) {
      currentNode = parent;
      if (currentNode.type === CONTAINER_NODE_TYPES.component) {
        // update the top-most main component with the current one
        componentNode = currentNode;
      }
      parent = parent.parent;
    }
  }

  if (componentNode) {
    return componentNode;
  }
  return null;
};

/**
 * @description Takes a frame node and uses its list data to create an array of design nodes that
 * currently have a record in the frame's list of nodes with an annotation of the given type.
 *
 * @kind function
 * @name getFrameAnnotatedNodes
 *
 * @param {string} type Indicates whether the we want keystop or label annotations.
 * @param {Object} options The top-level frame node we want to locate stops within,
 * and resetData set to true if we know annotations are being re-painted and
 * the top-level frame node’s list data should be cleared out.
 *
 * @returns {Array} An array of nodes (SceneNode) of annotations of the specified type.
 */
const getFrameAnnotatedNodes = (
  type: PluginStopType,
  options: {
    frame: FrameNode,
    resetData: boolean,
  },
): Array<SceneNode> => {
  const { frame, resetData } = options;
  const listItems: Array<{id: string, position: number}> = JSON.parse(frame.getPluginData(DATA_KEYS[`${type}List`]) || '[]');

  const nodes: Array<SceneNode> = listItems.reduce((acc, { id }) => {
    const node: SceneNode = frame.findOne(child => child.id === id);
    return node ? [...acc, node] : acc;
  }, []);

  // reset the top frame list – occurs when annotations are re-painted (re-added w/ new ids)
  if (resetData) {
    frame.setPluginData(
      DATA_KEYS[`${type}List`],
      JSON.stringify([]),
    );
  }

  return nodes;
};

/**
 * @description Recurses through a list of nodes and gathers those with assigned metadata.
 *
 * @kind function
 * @name getAssignedChildNodes
 *
 * @param {Array} children The child nodes to check for attached metdata.
 * @param {Array} currentList The existing list of nodes to check against when adding additional.
 * @param {string} type The type of stop data we are checking for (e.g. label or keystop).
 *
 * @returns {Array} A flat list of child nodes with data assigned to them.
 */
const getAssignedChildNodes = (
  children: Array<SceneNode>,
  currentList: Array<SceneNode>,
  type: PluginStopType,
) => {
  const childNodes = new Crawler({ for: children }).all();
  return childNodes.reduce((acc, node) => {
    let list = acc;
    const sourceData = getPeerPluginData(node);
    if (!existsInArray(currentList, node.id)
      && (
        (type === 'keystop' && sourceData?.hasKeystop)
        || (type === 'label' && sourceData?.role)
      )
    ) {
      list.push(node);
      if (
        node.children
        && (
          type === 'label'
          || (type === 'keystop' && sourceData.allowKeystopPassthrough)
        )
      ) {
        list = [
          ...list,
          ...getAssignedChildNodes(
            node.children,
            currentList,
            type,
          ),
        ];
      }
    }
    return list;
  }, []);
};

/**
 * @description A function that gets a list of all nodes to annotate in the order we want them.
 *
 * @kind function
 * @name getOrderedStopNodes
 *
 * @param {Array} selection The current Figma selection of nodes.
 * @param {Array} suppliedNodes A list of supplied nodes if they are passed in.
 * @param {string} type The type of stops we are annotating (e.g. label or keystop).
 *
 * @returns {Array}  A list of nodes to annotate in the correct order.
 */
const getOrderedStopNodes = (
  selection: Array<SceneNode>,
  suppliedNodes: Array<SceneNode>,
  type: PluginStopType,
) => {
  // determine top Frames involved in the current selection
  const selectionCrawler = new Crawler({ for: selection });
  const selectionTopFrames: Array<FrameNode> = selectionCrawler.topFrames();

  // initialize selected list based on supplied vs Figma selection
  let selectedNodes: Array<SceneNode> = suppliedNodes?.length
    ? [...suppliedNodes] : [...selection];

  // gather annotated nodes in top Frames and add selection children if not supplied
  const nodesToAnnotate: Array<SceneNode> = selectionTopFrames.reduce((acc, frame) => {
    let list = acc;
    const options = { frame, resetData: true };
    // add previously annotated nodes to the result list
    const annotatedFrameNodes = getFrameAnnotatedNodes(type, options);
    list = [...list, ...annotatedFrameNodes];

    // if not annotating supplied nodes, add Figma selection children to selected list
    if (!suppliedNodes?.length && frame.children) {
      const exclusionList = [...list, ...selectedNodes, ...selectionTopFrames];
      const assignedChildNodes = getAssignedChildNodes(
        [...frame.children],
        exclusionList,
        type,
      );
      selectedNodes = [...selectedNodes, ...assignedChildNodes];
    }
    return list;
  }, []);

  // filter selected to what isn't in the results list and sort by visual hierarchy
  selectedNodes = selectedNodes.filter((node: SceneNode) => !existsInArray([
    ...nodesToAnnotate,
    ...selectionTopFrames,
  ], node.id));
  const sortedSelection = new Crawler({ for: selectedNodes }).sorted();

  return [...nodesToAnnotate, ...sortedSelection];
};

export {
  findParentInstance,
  findLegendFrame,
  findOrphanedLegendFrame,
  findTopComponent,
  getFrameAnnotatedNodes,
  getOrderedStopNodes,
  getAssignedChildNodes,
};
