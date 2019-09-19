/**
 * @description A set of functions to operate the plugin GUI.
 */
import './views/webview.css';

/* watch Navigation action buttons */
const actionsElement = (<HTMLInputElement> document.getElementById('actions'));

if (actionsElement) {
  const onClick = (e: MouseEvent) => {
    const target = e.target as HTMLTextAreaElement;
    const button = target.closest('button');

    if (button) {
      // find action by element id
      const action = button.id;

      // bubble action to main
      parent.postMessage({
        pluginMessage: {
          navType: action,
        },
      }, '*');
    }
  };

  actionsElement.addEventListener('click', onClick);
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
      const action = button.id;

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

const showHideInput = (
  action: 'show' | 'hide',
  data?: {
    initialValue: string
  },
) => {
  const containerElement = (<HTMLInputElement> document.getElementsByClassName('container')[0]);

  if (action === 'show') {
    containerElement.classList.add('wide');
    actionsElement.style.display = 'none';
    userInputElement.removeAttribute('style');

    // focus on input and set initial value
    const inputElement = (<HTMLInputElement> userInputElement.getElementsByClassName('input')[0]);
    cmdAHelper(inputElement);
    inputElement.value = data.initialValue;
    inputElement.focus();
    inputElement.select();
  } else {
    containerElement.classList.remove('wide');
    actionsElement.removeAttribute('style');
    userInputElement.style.display = 'none';
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
    default:
      return null;
  }

  return null;
};
