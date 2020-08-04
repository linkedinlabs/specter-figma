/**
 * @description A set of functions to operate the plugin GUI.
 */
import { isInternal } from './Tools';
import './assets/css/main.scss';

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

// process action
const processActionClick = (e) => {
  const target = e.target as HTMLTextAreaElement;
  const button = target.closest('button');

  if (button) {
    // find action by element id
    let action = button.id;
    if (button.classList.contains('hide')) {
      action = `${action}-hide`;
    }

    // bubble action to main
    parent.postMessage({
      pluginMessage: {
        navType: action,
      },
    }, '*');
  }
};

/* watch Navigation main buttons */
const mainElement = (<HTMLInputElement> document.getElementById('main'));

if (mainElement) {
  const onClick = (e: MouseEvent) => processActionClick(e);
  mainElement.addEventListener('click', onClick);
}

/* watch Info panel triggers */
const infoButtonElement = (<HTMLInputElement> document.getElementById('info'));
const infoBackButtonElement = (<HTMLInputElement> document.getElementById('info-hide'));

if (infoButtonElement) {
  const onClick = (e: MouseEvent) => processActionClick(e);
  infoButtonElement.addEventListener('click', onClick);
}

if (infoBackButtonElement) {
  const onClick = (e: MouseEvent) => processActionClick(e);
  infoBackButtonElement.addEventListener('click', onClick);
}

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

/* watch Info Panel action buttons WIP */
const infoPanelElement = (<HTMLInputElement> document.getElementById('infoPanel'));

if (infoPanelElement) {
  const onClick = (e: MouseEvent) => {
    const target = e.target as HTMLTextAreaElement;
    const button = target.closest('button');

    if (button) {
      // find action by element id
      const action = button.id.replace('infoPanel-', '');

      // bubble action to main
      parent.postMessage({
        pluginMessage: {
          inputType: action,
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
    mainElement.style.display = 'none';
    infoButtonElement.style.display = 'none';
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
    mainElement.removeAttribute('style');
    infoButtonElement.removeAttribute('style');
    userInputElement.style.display = 'none';
  }
};

const showHideInfo = (action: 'show' | 'hide') => {
  const containerElement = (<HTMLInputElement> document.getElementsByClassName('container')[0]);
  const transitionMaskElement = (<HTMLDivElement> containerElement.getElementsByClassName('transition-mask')[0]);

  const setInternalInfo = () => {
    const internalElements: HTMLCollection = document.getElementsByClassName('internal');
    const externalElements: HTMLCollection = document.getElementsByClassName('external');

    for (let i = 0; i < internalElements.length; i += 1) {
      const internalElement: HTMLElement = internalElements[i] as HTMLElement;
      internalElement.style.display = 'block';
    }

    for (let i = 0; i < externalElements.length; i += 1) {
      const externalElement: HTMLElement = externalElements[i] as HTMLElement;
      externalElement.style.display = 'none';
    }
  };

  if (action === 'show') {
    containerElement.classList.add('info-transition');
    if (isInternal()) { setInternalInfo(); }
    setTimeout(() => {
      transitionMaskElement.classList.add('visible');
      setTimeout(() => {
        containerElement.classList.add('info-open');
        infoButtonElement.classList.add('hide');
        mainElement.style.display = 'none';
        infoPanelElement.removeAttribute('style');
        transitionMaskElement.classList.remove('visible');
        setTimeout(() => containerElement.classList.remove('info-transition'), 175);
      }, 175);
    }, 15);
  } else {
    containerElement.classList.add('info-transition');
    setTimeout(() => {
      transitionMaskElement.classList.add('visible');
      setTimeout(() => {
        containerElement.classList.remove('info-open');
        infoButtonElement.classList.remove('hide');
        mainElement.removeAttribute('style');
        infoPanelElement.style.display = 'none';
        transitionMaskElement.classList.remove('visible');
        setTimeout(() => containerElement.classList.remove('info-transition'), 175);
      }, 175);
    }, 15);
  }
};

const showHideMercadoMode = (isMercadoMode: boolean) => {
  const bannerElement: HTMLElement = document.querySelector('.mercado-banner');

  if (bannerElement) {
    if (isMercadoMode) {
      bannerElement.removeAttribute('style');
    } else {
      bannerElement.style.display = 'none';
    }
  }
};

/* watch for Messages from the plugin */
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
      showHideMercadoMode(pluginMessage.payload);
      break;
    default:
      return null;
  }

  return null;
};

// init GUI
sendLoadedMsg();
