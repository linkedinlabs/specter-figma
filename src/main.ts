// ++++++++++++++++++++++++++ Specter for Figma +++++++++++++++++++++++++++

// invoked commands -------------------------------------------------

/** WIP
 * @description Identifies and annotates a selected layer in a Sketch file.
 *
 * @kind function
 * @name annotateLayer
 * @param {Object} context The current context (event) received from Sketch.
 * @returns {null} Shows a Toast in the UI if nothing is selected.
 */
const annotateLayer = (closeGui: boolean): void => {
  console.log('action: annotateLayer');

  if (closeGui) {
    figma.closePlugin();
  }
  return null;
};

/** WIP
 * @description Annotates a selected layer in a Sketch file with user input.
 *
 * @kind function
 * @name annotateLayerCustom
 * @param {Object} context The current context (event) received from Sketch.
 * @returns {null} Shows a Toast in the UI if nothing is selected or
 * if multiple layers are selected.
 */
const annotateLayerCustom = (closeGui: boolean): void => {
  console.log('action: annotateLayerCustom');

  if (closeGui) {
    figma.closePlugin();
  }
  return null;
};

/** WIP
 * @description Annotates a selection of layers in a Sketch file with the
 * spacing number (“IS-X”) based on the gap between the two layers.
 *
 * @kind function
 * @name annotateMeasurement
 * @param {Object} context The current context (event) received from Sketch.
 * @returns {null} Shows a Toast in the UI if nothing is selected or
 * if more than two layers are selected.
 */
const annotateMeasurement = (closeGui: boolean): void => {
  console.log('action: annotateMeasurement');

  if (closeGui) {
    figma.closePlugin();
  }
  return null;
};

/** WIP
 * @description Draws a semi-transparent “Bounding Box” around any selected elements.
 *
 * @kind function
 * @name drawBoundingBox
 * @param {Object} context The current context (event) received from Sketch.
 * @returns {null} Shows a Toast in the UI if nothing is selected.
 */
const drawBoundingBox = (closeGui: boolean = true): void => {
  console.log('action: drawBoundingBox');

  if (closeGui) {
    figma.closePlugin();
  }
  return null;
};

// watch for commands -------------------------------------------------
/** WIP
 * @description Identifies and annotates a selected layer in a Sketch file.
 *
 * @kind function
 * @name dispatch
 * @param {string} actionType A string representing the action received from the GUI.
 * @returns {null}
 */
const dispatch = (action: {
  type: string,
  visual: boolean,
}): void => {
  const closeGui: boolean = !action.visual;
  switch (action.type) {
    case 'annotate':
      annotateLayer(closeGui);
      break;
    case 'annotate-custom':
      annotateLayerCustom(closeGui);
      break;
    case 'bounding':
      drawBoundingBox(closeGui);
      break;
     case 'measure':
       annotateMeasurement(closeGui);
       break;
     default:
       // show UI – command: tools
       figma.showUI(__html__, { width: 140, height: 180 }); // eslint-disable-line no-undef
  }
}

// watch menu commands -------------------------------------------------
if (figma.command) {
  dispatch({
    type: figma.command,
    visual: false,
  });
}

// watch GUI action clicks -------------------------------------------------
figma.ui.onmessage = (msg): void => {
  if (msg.type) {
    dispatch({
      type: msg.type,
      visual: true,
    });
  }

  // if (msg.type === 'lawls') {
  //   console.log('hullo');
  //   figma.ui.resize(300, 400);
  // }
};
