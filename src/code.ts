// ++++++++++++++++++++++++++ Specter for Figma +++++++++++++++++++++++++++
import App from './App';
import Messenger from './Messenger';
import {
  awaitUIReadiness,
  loadFirstAvailableFontAsync,
  resizeGUI,
} from './Tools';
import { DATA_KEYS, TYPEFACES } from './constants';

// GUI management -------------------------------------------------

/**
 * @description Shuts down the plugin and closes the GUI.
 *
 * @kind function
 * @name terminatePlugin
 *
 * @returns {null}
 */
const terminatePlugin = (): void => {
  // close the plugin without suppressing error messages
  figma.closePlugin();
  return null;
};

// watch for commands -------------------------------------------------

/**
 * @description Takes a unique string (`type`) and calls the corresponding action
 * in the App class. Also does some housekeeping duties such as pre-loading typefaces
 * and managing the GUI.
 *
 * @kind function
 * @name dispatcher
 * @param {Object} action An object comprised of `type`, a string representing
 * the action received from the GUI and `visual` a boolean indicating if the
 * command came from the GUI or the menu.
 * @returns {null}
 */
const dispatcher = async (action: {
  payload?: any,
  type: string,
  visual: boolean,
}) => {
  const {
    payload,
    // sessionKey,
    type,
    // visual,
  } = action;

  // if the action is not visual, close the plugin after running
  const shouldTerminate: boolean = !action.visual;

  // retrieve existing options
  const lastUsedOptions: PluginOptions = await figma.clientStorage.getAsync(DATA_KEYS.options);

  // set mercado mode flag
  let isMercadoMode: boolean = false;
  if (lastUsedOptions && lastUsedOptions.isMercadoMode !== undefined) {
    isMercadoMode = lastUsedOptions.isMercadoMode;
  }

  // pass along some GUI management and navigation functions to the App class
  const app = new App({
    isMercadoMode,
    shouldTerminate,
    terminatePlugin,
  });

  // run the action in the App class based on type
  const runAction = async (actionType: string) => {
    switch (actionType) {
      case 'a11y-keyboard-add-stop':
        await app.annotateKeystop();
        break;
      case 'a11y-keyboard-remove-stop': {
        const { id } = payload;
        if (id) {
          await app.removeKeystops(id);
        }
        break;
      }
      case 'a11y-keyboard-update-stop': {
        const { id } = payload;
        if (id) {
          await app.updateKeystops(payload);
        }
        break;
      }
      case 'a11y-keyboard-set-key':
        await app.keystopAddRemoveKeys(payload);
        break;
      case 'a11y-keyboard-remove-key':
        await app.keystopAddRemoveKeys(payload, true);
        break;
      case 'annotate':
        app.annotateNode();
        break;
      case 'annotate-custom':
        app.annotateNodeCustom();
        break;
      case 'annotate-spacing-left':
        app.annotateSpacingOnly('left');
        break;
      case 'annotate-spacing-right':
        app.annotateSpacingOnly('right');
        break;
      case 'annotate-spacing-top':
        app.annotateSpacingOnly('top');
        break;
      case 'annotate-spacing-bottom':
        app.annotateSpacingOnly('bottom');
        break;
      case 'annotate-spacing-al-padding':
        app.annotateSpacingALPadding();
        break;
      case 'bounding':
        app.drawBoundingBoxes();
        break;
      case 'bounding-multi':
        app.drawBoundingBoxes('multiple');
        break;
      case 'corners':
        app.annotateCorners();
        break;
      case 'measure':
        app.annotateMeasurement();
        break;
      case 'info':
        setTimeout(() => {
          resizeGUI('info', figma.ui);
        }, 190);
        figma.ui.postMessage({
          action: 'showInfo',
        });
        break;
      case 'info-hide': {
        setTimeout(() => {
          // let refresh determine size using plugin options for current view
          App.refreshGUI();
        }, 180);

        // switch views
        figma.ui.postMessage({
          action: 'hideInfo',
        });
        break;
      }
      case 'mercado-mode-toggle': {
        await App.toggleMercadoMode();
        break;
      }
      case 'resize':
        App.resizeGUI(payload);
        break;
      case 'setViewContext':
        await App.setViewContext(payload);
        break;
      default:
        await App.showToolbar();
    }
  };

  // load the typeface and then run the action
  const runActionWithTypefaces = async (actionType: string) => {
    // typefaces should be loaded before running action
    const typefaceToUse: FontName = await loadFirstAvailableFontAsync(TYPEFACES);

    // set the currently-loaded typeface in page settings
    if (typefaceToUse) {
      figma.currentPage.setPluginData('typefaceToUse', JSON.stringify(typefaceToUse));
    }

    // run the action
    await runAction(actionType);
  };
  await runActionWithTypefaces(type);

  return null;
};
export default dispatcher;

/**
 * @description Acts as the main wrapper function for the plugin. Run by default
 * when Figma calls the plugin.
 *
 * @kind function
 * @name main
 *
 * @returns {null}
 */
const main = async () => {
  // set up logging
  const messenger = new Messenger({ for: figma, in: figma.currentPage });

  // set up the UI, hidden by default -----------------------------------------
  figma.showUI(__html__, { visible: false }); // eslint-disable-line no-undef

  // make sure UI has finished setting up
  await awaitUIReadiness(messenger);

  // watch menu commands -------------------------------------------------
  if (figma.command) {
    dispatcher({
      type: figma.command,
      visual: false,
    });
  }

  // watch GUI messages -------------------------------------------------
  figma.ui.onmessage = (msg: { action: string, payload: any }): void => {
    const { action, payload } = msg;
    // watch for actions and send to `dispatcher`
    if (action) {
      dispatcher({
        payload,
        type: action,
        visual: true,
        // sessionKey: SESSION_KEY,
      });
    }

    // ignore everything else
    return null;
  };

  // ----- watch selection/page changes on the Figma level -------------------------------
  //   --- we diff some params of the current selection to watch for object movement
  // set up tracking data based on selection
  /**
   * @description A helper function. It takes an array of nodes and sets up an array
   * of data to track (id, x/y, width/height, parent).
   *
   * @kind function
   * @name compareTrackingData
   *
   * @param {Array} selectedNodes An array of Figma nodes.
   *
   * @returns {Array} An array of tracking data.
   */
  const setTrackingData = (selectedNodes: Array<SceneNode>): Array<{
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
    parent: {
      id: string,
    }
  }> => {
    const tempTrackingData = [];
    selectedNodes.forEach((selectedNode) => {
      const {
        height,
        id,
        parent,
        width,
        x,
        y,
      } = selectedNode;

      const data: {
        id: string,
        x: number,
        y: number,
        width: number,
        height: number,
        parent: {
          id: string,
        }
      } = {
        id,
        x,
        y,
        width,
        height,
        parent,
      };

      tempTrackingData.push(data);
    });

    return tempTrackingData;
  };

  // set the initial timestamp; this is used as a global to update over time and prevent race cases
  let initialStamp = new Date().getTime();

  /**
   * @description Top-level selection-watching logic. This watcher periodically compares the
   * position of all of the nodes in the current selection with the last measurement taken.
   * If they are different, App.refreshGUI is called. Either way, a new, future comparison is
   * set up. To prevent race cases, the watcher stops checking if a new selection is made at
   * the Figma level, or if there has not been a change in several minutes.
   *
   * @kind function
   * @name compareTrackingData
   */
  const watchSelection = (): void => {
    // update immediately on a selection change
    // App.refreshGUI(SESSION_KEY);
    App.refreshGUI();

    // set the interval for each diff check
    const checkInternal = 200;

    // update/set the comparison timestamps
    initialStamp = new Date().getTime();
    const currentStamp = initialStamp;
    let lastChangeTime = initialStamp;

    /**
     * @description Compares two sets of tracking data and also evaluates the current comparison
     * timestamps. If a difference is found in the tracking data, a UI refresh is called. If
     * both conditions are met in the timestamp evaluation, a future check is set up.
     *
     * @kind function
     * @name compareTrackingData
     *
     * @param {Array} dataset1 A set of tracking data to compare (array of nodes).
     * @param {Array} dataset2 A set of tracking data to compare (array of nodes).
     */
    const compareTrackingData = (dataset1, dataset2): void => {
      // if a difference is found, refresh the UI and update the last change stamp
      if (JSON.stringify(dataset1) !== JSON.stringify(dataset2)) {
        lastChangeTime = new Date().getTime();
        App.refreshGUI();
      }

      // set current time and time since last change
      const currentTime = new Date().getTime();
      const timeDifference = (currentTime - lastChangeTime);

      // if the stamps match (i.e. they're from the latest selection watcher event) and
      // the last change timeout has not been reached, trigger a new, future comparison event
      if ((currentStamp === initialStamp) && (timeDifference < 120000)) {
        setTimeout(() => {
          const newTrackingData = setTrackingData(figma.currentPage.selection as Array<SceneNode>);
          compareTrackingData(dataset2, newTrackingData);
        }, checkInternal);
      }
    };

    // set the initial tracking data
    const initialTrackingData = setTrackingData(figma.currentPage.selection as Array<SceneNode>);

    // after the check interval has passed, set new tracking data and trigger the first comparison
    setTimeout(() => {
      const newTrackingData = setTrackingData(figma.currentPage.selection as Array<SceneNode>);
      compareTrackingData(initialTrackingData, newTrackingData);
    }, checkInternal);
  };

  // selection change watcher
  figma.on('selectionchange', () => watchSelection());

  // always trigger a refresh on the page change
  figma.on('currentpagechange', () => {
    // App.refreshGUI(SESSION_KEY);
    App.refreshGUI();
  });
};

// run main as default
main();
