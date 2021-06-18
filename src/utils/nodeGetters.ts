import { CONTAINER_NODE_TYPES, DATA_KEYS } from '../constants';
import {
  existsInArray,
  findTopFrame,
  getPeerPluginData,
  updateArray,
} from './tools';
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
 * @name getLegendFrame
 * @param {Object} frameId The design top frame we're looking for a legend for.
 * @param {Object} page The Figma page the frame belongs to.
 *
 * @returns {Object} The legend for the frame (or undefined, if it doesn't exist).
 */
const getLegendFrame = (frameId: string, page: PageNode) => {
  let legendFrame = null;
  const frameTrackingData = JSON.parse(page.getPluginData(DATA_KEYS.legendFrames) || '[]');
  const trackingEntry = frameTrackingData.find(entry => entry.id === frameId);

  if (trackingEntry?.legendId) {
    legendFrame = figma.getNodeById(trackingEntry.legendId);
  }
  return legendFrame;
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
 * @param {Object} frame The top-level frame node we want to locate stops within.
 *
 * @returns {Array} An array of nodes (SceneNode) of annotations of the specified type.
 */
const getFrameAnnotatedNodes = (
  type: PluginStopType,
  frame: FrameNode,
): Array<SceneNode> => {
  const list = JSON.parse(frame?.getPluginData(DATA_KEYS[`${type}List`]) || '[]');
  const nodes: Array<SceneNode> = list.reduce((acc, { id }) => {
    const node: SceneNode = frame.findOne(child => child.id === id);
    if (node) {
      acc.push(node);
    }
    return acc;
  }, []);

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
 * @param {string} type The type of stop data we are checking for (eg: label or keystop).
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
    const {
      hasKeystop,
      allowKeystopPassthrough,
    } = getPeerPluginData(node) || {};
    const hasKeystopData = type === 'keystop' && hasKeystop;

    if (
      !existsInArray(currentList, node.id)
      && !existsInArray(list, node.id)
      && (hasKeystopData)
    ) {
      list.push(node);
      if (node.children && (type === 'keystop' && allowKeystopPassthrough)) {
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
 * @description Gets a list of nodes who have a selected annotation, to be used when marking
 * selected items in the UI item list.
 *
 * @kind function
 * @name getSelectedAnnotationItems
 *
 * @param {Object} page The current Figma page, for getting the master annotation list.
 * @param {string} type The type of stop/tab we are working with.
 *
 * @returns {Array} A flat list of nodes whose annotations are selected.
 */
const getSelectedAnnotationItems = (page: PageNode, type: PluginStopType) => {
  const { selection } = page;
  const trackingData = JSON.parse(page.getPluginData(DATA_KEYS[`${type}Annotations`]) || null);
  const selectedAnnotations = selection
    .filter(node => JSON.parse(node.getPluginData(DATA_KEYS[`${type}LinkId`]) || null)?.role === 'annotation');

  const nodes = selectedAnnotations.map(({ id }) => {
    const matchId = trackingData?.find(({ annotationId }) => annotationId === id)?.id;
    return matchId && figma.getNodeById(matchId);
  });

  return nodes;
};

/**
 * @description Gets a list of nodes who have a selected annotation, to be used when marking
 * selected items in the UI item list.
 *
 * @kind function
 * @name getDesignNodeFromAnnotation
 *
 * @param {Object} page The current Figma page, for getting the master annotation list.
 * @param {Object} annotation The annotation node to find the linked design node of.
 *
 * @returns {Object} The linked design node for the annotation.
 */
const getDesignNodeFromAnnotation = (page: PageNode, annotation: FrameNode) => {
  let designNodeId;
  const stopType = ['keystop', 'label', 'heading', 'misc']
    .find((type) => annotation.name.toLowerCase().includes(type));
  
  if (stopType) {
    const trackingData = JSON.parse(page.getPluginData(DATA_KEYS[`${stopType}Annotations`]) || null);
    designNodeId = trackingData?.find(entry => entry.annotationId === annotation.id)?.id;
  } else {
    designNodeId = JSON.parse(annotation.getPluginData(DATA_KEYS.generalLinkId) || null)?.id;
  }

  return designNodeId && figma.getNodeById(designNodeId);
};

/**
 * @description A function that gets a list of all nodes to annotate in the order we want them.
 *
 * @kind function
 * @name getOrderedStopNodes
 *
 * @param {string} type The type of stops we are annotating (eg: label or keystop).
 * @param {Array} selection The current Figma selection of nodes.
 * @param {boolean} newOnly Indicates whether we want a list of all nodes or just new annotations.
 * @param {Array} suppliedNodes A list of supplied nodes if they are passed in.
 *
 * @returns {Array}  A list of nodes to annotate in the correct order.
 */
const getOrderedStopNodes = (
  type: PluginStopType,
  selection: Array<SceneNode>,
  newOnly: boolean,
  suppliedNodes?: Array<SceneNode>,
) => {
  let selectedNodes: Array<SceneNode> = suppliedNodes || [...selection];
  const frame: FrameNode = findTopFrame(selectedNodes[0]);
  if (frame) {
    let orderedNodes = [];

    // add previously annotated nodes to the result list
    const annotatedFrameNodes = getFrameAnnotatedNodes(type, frame);
    annotatedFrameNodes.forEach((node) => {
      orderedNodes = updateArray(orderedNodes, node);
    });

    // if not annotating supplied nodes, add Figma selection children to selected list
    if (!suppliedNodes && frame.children) {
      const exclusionList = [...orderedNodes, ...selectedNodes, frame];
      const assignedChildNodes = getAssignedChildNodes(
        [...selectedNodes],
        exclusionList,
        type,
      );
      assignedChildNodes.forEach(node => selectedNodes.push(node));
    }

    // filter selected to what isn't in the results list and sort by visual hierarchy
    selectedNodes = selectedNodes.filter(({ id }) => !existsInArray(orderedNodes, id)
      && frame.id !== id);
    const sortedSelection = new Crawler({ for: selectedNodes }).sorted();
    sortedSelection.forEach(node => orderedNodes.push(node));

    return newOnly ? sortedSelection : orderedNodes;
  }
  return [];
};

/**
 * @description A function that gets a list of all spec pages based on SPEC inclusion in the name.
 *
 * @kind function
 * @name getSpecPageList
 *
 * @param {Array} pages All pages in the figma file.
 *
 * @returns {Array}  A list of pages that are auto-generated SPEC pages.
 */
const getSpecPageList = (pages) => {
  const specPages = pages.filter(page => page.name.includes('SPEC ')).map(({ name, id }) => ({ name, id }));
  return specPages;
};

/**
 * @description A function that gets a list of Specter annotation groups.
 *
 * @kind function
 * @name getSpecterGroups
 *
 * @param {Array} page The current page in Figma.
 *
 * @returns {Array} A list of groups containing Specter annotations.
 */
const getSpecterGroups = (page) => {
  const specterGroups = [];
  const frames = page.children.filter(({ type }) => type === 'FRAME') as Array<FrameNode>;

  frames.forEach((el) => {
    const group = el.findChild(({ type, name }) => type === 'GROUP' && name.includes('Specter'));
    if (group) {
      specterGroups.push(group);
    }
  });
  return specterGroups;
};

export {
  findParentInstance,
  findTopComponent,
  getDesignNodeFromAnnotation,
  getLegendFrame,
  getSelectedAnnotationItems,
  getSpecPageList,
  getOrderedStopNodes,
  getSpecterGroups,
};
