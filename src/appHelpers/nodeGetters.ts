import { DATA_KEYS } from '../constants';
import Crawler from '../Crawler';
import { existsInArray, getPeerPluginData } from '../Tools';

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
 * @description Recurses through a list of nodes to gather those with assigned metadata.
 *
 * @kind function
 * @name getAssignedChildNodes
 *
 * @param {Array} children The child nodes we will check for attached metdata.
 * @param {Array} currentList The existing list of nodes to check against when adding additional.
 * @param {string} type The type of stop data we are checking for (e.g. label or keystop).
 *
 * @returns {Array} Flat list of child nodes with data assigned to them.
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
 * @description Gets a list of all nodes to annotate in the order we want them.
 * Nodes that have already been annotated.
 * Additional nodes that have stop data attached to them.
 * Additional nodes that are in the selection.
 *
 * @kind function
 * @name getOrderedStopNodes
 *
 * @param {Array} selection The current Figma selection of nodes.
 * @param {Array} suppliedNodes A list of supplied nodes if passed in.
 * @param {string} type The type of stops we're annotating (e.g. label or keystop).
 *
 * @returns {Array} List of nodes to annotate in the correct order.
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
  getFrameAnnotatedNodes,
  getOrderedStopNodes,
  getAssignedChildNodes,
};
