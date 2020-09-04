/**
 * @description A set of functions to operate the plugin GUI.
 */
import { isInternal } from './Tools';
import './assets/css/main.scss';
import App from './views/App.svelte'; // eslint-disable-line import/extensions

const app = new App({
  target: document.body,
  props: {
    isInternal: isInternal(),
    isMercadoMode: false,
    isUserInput: false,
    isInfoPanel: false,
    userInputValue: null,
  },
});

/**
 * @description Posts a message to the main thread with `loaded` set to `true`. Used in the
 * main thread to indicate the GUI is listening.
 *
 * @kind function
 * @name sendLoadedMsg
 *
 * @returns {null}
 */
const sendLoadedMsg = (): void => {
  // send message to main thread indicating UI has loaded
  parent.postMessage({ pluginMessage: { loaded: true } }, '*');

  return null;
};

/* process Messages from the plugin */
const showHideInput = (
  action: 'show' | 'hide',
  initialValue?: string,
) => {
  if (action === 'show') {
    app.isUserInput = true;
    app.userInputValue = initialValue;
  } else {
    app.isUserInput = false;
  }
};

const showHideInfo = (action: 'show' | 'hide') => {
  const containerElement = (<HTMLInputElement> document.getElementsByClassName('container')[0]);
  const transitionMaskElement = (<HTMLDivElement> containerElement.getElementsByClassName('transition-mask')[0]);

  if (action === 'show') {
    containerElement.classList.add('info-transition');
    setTimeout(() => {
      transitionMaskElement.classList.add('visible');
      setTimeout(() => {
        app.isInfoPanel = true;
        transitionMaskElement.classList.remove('visible');
        setTimeout(() => containerElement.classList.remove('info-transition'), 175);
      }, 175);
    }, 15);
  } else {
    containerElement.classList.add('info-transition');
    setTimeout(() => {
      transitionMaskElement.classList.add('visible');
      setTimeout(() => {
        app.isInfoPanel = false;
        transitionMaskElement.classList.remove('visible');
        setTimeout(() => containerElement.classList.remove('info-transition'), 175);
      }, 175);
    }, 15);
  }
};

/**
 * @description Watches for incoming messages from the plugin’s main thread and dispatches
 * them to the appropriate GUI actions.
 *
 * @kind function
 * @name watchIncomingMessages
 *
 * @returns {null}
 */
const watchIncomingMessages = (): void => {
  onmessage = ( // eslint-disable-line no-undef
    event: {
      data: {
        pluginMessage: {
          action: string,
          payload: any,
        }
      }
    },
  ) => {
    const { pluginMessage } = event.data;
    const { payload } = pluginMessage;

    switch (pluginMessage.action) {
      case 'showInput': {
        const { initialValue } = payload;
        showHideInput('show', initialValue);
        break;
      }
      case 'hideInput':
        showHideInput('hide');
        break;
      case 'showInfo':
        showHideInfo('show');
        break;
      case 'hideInfo':
        showHideInfo('hide');
        break;
      case 'setMercadoMode':
        app.isMercadoMode = payload;
        break;
      default:
        return null;
    }

    return null;
  };
};

// init GUI
window.app = app; // eslint-disable-line no-undef
watchIncomingMessages();
sendLoadedMsg();

export default app;
