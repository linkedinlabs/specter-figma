import './views/webview.css';

document.getElementById('annotate').onclick = () => {
  const textbox = (<HTMLInputElement> document.getElementById('count'));
  const count = parseInt(textbox.value, 10);
  parent.postMessage({
    pluginMessage: {
      type: 'create-rectangles',
      count,
    },
  }, '*');
};

document.getElementById('measure').onclick = () => {
  const textbox = (<HTMLInputElement> document.getElementById('count'));
  const count = parseInt(textbox.value, 10);
  parent.postMessage({
    pluginMessage: {
      type: 'lawls',
      count,
    },
  }, '*');
};
