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

/* watch User Input action buttons */
const userInputElement = (<HTMLInputElement> document.getElementById('userInput'));

if (userInputElement) {
  const onClick = (e: MouseEvent) => {
    const target = e.target as HTMLTextAreaElement;
    const button = target.closest('button');
    const inputElement = (<HTMLInputElement> userInputElement.getElementsByClassName('input')[0]);

    if (button) {
      // find action by element id
      const action = button.id.replace('userInput-', '');

      // bubble action to main
      parent.postMessage({
        pluginMessage: {
          inputType: action,
          inputValue: inputElement.value,
        },
      }, '*');
    }
  };

  userInputElement.addEventListener('click', onClick);
}

/* process Messages from the plugin */
const cmdAHelper = (inputElement: HTMLInputElement) => {
  const onKeydown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.which === 65) {
      e.stopPropagation();
      e.preventDefault();
      if (e.shiftKey) {
        inputElement.setSelectionRange(0, 0);
      } else {
        inputElement.setSelectionRange(0, inputElement.value.length);
      }
    }
  };

  inputElement.addEventListener('keydown', onKeydown);
};

const watchKeyboardActions = (e: KeyboardEvent) => {
  let button: HTMLButtonElement = null;

  if ((e.which === 13) || (e.code === 'Enter') || (e.code === 'NumpadEnter')) {
    button = document.getElementById('userInput-submit') as HTMLButtonElement;
  }

  if ((e.which === 27) || (e.code === 'Escape')) {
    button = document.getElementById('userInput-cancel') as HTMLButtonElement;
  }

  if (button) {
    button.click();
  }
};

const showHideInput = (
  action: 'show' | 'hide',
  data?: {
    initialValue: string
  },
) => {
  const containerElement = (<HTMLInputElement> document.getElementsByClassName('container')[0]);

  if (action === 'show') {
    containerElement.classList.add('wide');
    userInputElement.removeAttribute('style');

    // focus on input and set initial value
    const inputElement = (<HTMLInputElement> userInputElement.getElementsByClassName('input')[0]);
    cmdAHelper(inputElement);
    inputElement.value = data.initialValue;
    inputElement.focus();
    inputElement.select();
    inputElement.addEventListener('keyup', watchKeyboardActions);
  } else {
    containerElement.classList.remove('wide');
    userInputElement.style.display = 'none';
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
      case 'showInput':
        showHideInput('show', pluginMessage.payload);
        break;
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
