// ++++++++++++++++++++++++++ Specter for Figma +++++++++++++++++++++++++++
import App from './App';
import Messenger from './Messenger';
import { awaitUIReadiness, loadFirstAvailableFontAsync } from './utils/tools';
import { DATA_KEYS, TYPEFACES } from './constants';
import { getSpecPageList, getSpecterGroups } from './utils/nodeGetters';

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
    type,
  } = action;

  // if the action is not visual, close the plugin after running
  const shouldTerminate: boolean = !action.visual;
  const specPages = getSpecPageList(figma.root.children);
  const lockedAnnotations = !getSpecterGroups(figma.currentPage).find(group => !group.locked);

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
    specPages,
    lockedAnnotations,
  });

  // run the action in the App class based on type
  const runAction = async (actionType: string) => {
    switch (actionType) {
      case 'a11y-add-stop': {
        app.annotateStops(payload.type);
        break;
      }
      case 'a11y-remove-stop': {
        const { id } = payload;
        app.removeStopAnnotation(payload.type, id);
        break;
      }
      case 'a11y-update-stop': {
        const { id, position } = payload;
        app.updateStopOrder(payload.type, id, position);
        break;
      }
      case 'a11y-set-node-data':
        await app.updateNodeData(payload.id, payload.key, payload.value);
        break;
      case 'annotate':
        app.annotateGeneral();
        break;
      case 'annotate-custom':
        app.annotateCustom();
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
      case 'generate': {
        const { pageId, newSpecName, settings } = payload;
        app.generateTemplate(pageId, newSpecName, settings);
        break;
      }
      case 'color': {
        app.updateAnnotationColor(payload.color);
        break;
      }
      case 'pointer': {
        app.updateAnnotationDirection(payload.direction);
        break;
      }
      case 'lock': {
        app.toggleLocked();
        break;
      }
      case 'info':
        App.showHideInfo();
        break;
      case 'info-hide': {
        App.showHideInfo(false);
        break;
      }
      case 'mercado-mode-toggle': {
        await App.toggleMercadoMode();
        break;
      }
      case 'resize':
        App.resizeGUIHeight(payload);
        break;
      case 'setViewContext':
        await App.setViewContext(payload);
        break;
      default: // case 'tools'
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

  // set initial options
  await App.runCleanup();

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

  figma.on('selectionchange', () => App.refreshGUI());
  figma.on('currentpagechange', () => App.refreshGUI(true));
};

// run main as default
main();
