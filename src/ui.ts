import './ui.css'

document.getElementById('create').onclick = () => {
  const textbox = (<HTMLInputElement> document.getElementById('count'));
  const count = parseInt(textbox.value, 10);
  parent.postMessage({
    pluginMessage: {
      type: 'create-rectangles',
      count,
    }
  }, '*')
}

document.getElementById('lol').onclick = () => {
  const textbox = (<HTMLInputElement> document.getElementById('count'));
  const count = parseInt(textbox.value, 10);
  parent.postMessage({
    pluginMessage: {
      type: 'lawls',
      count,
    }
  }, '*')
}


document.getElementById('cancel').onclick = () => {
  parent.postMessage({ pluginMessage: { type: 'cancel' } }, '*')
}
