/**
 * @description A set of functions to operate the plugin GUI.
 */
import './views/webview.css';

const actions = (<HTMLInputElement> document.getElementById('actions')); 

if (actions) {
  const onClick = (e: MouseEvent) => {
    const target = e.target as HTMLTextAreaElement;
    const button = target.closest('button');
    
     if (button) {
       // find action by element id
       const action = button.id;

       // bubble action to main
       parent.postMessage({
         pluginMessage: {
           type: action,
         },
       }, '*');
     }
  }

  actions.addEventListener('click', onClick);
}
