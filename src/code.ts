// This plugin will open a modal to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser enviroment (see documentation).

const getRandomInt = (min, max) => {
  const setMin = Math.ceil(min);
  const setMax = Math.floor(max);
  const num = Math.floor(Math.random() * (setMax - setMin + 1)) + setMin;
  return num;
}

// This shows the HTML page in "ui.html".
figma.showUI(__html__, { width: 100, height: 300 });

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = msg => {
  // One way of distinguishing between different types of messages sent from
  // your HTML page is to use an object with a "type" property like this.
  if (msg.type === 'create-rectangles') {
    const nodes: SceneNode[] = [];
    for (let i = 0; i < msg.count; i++) {
      const rect = figma.createRectangle();
      rect.x = i * 20;
      rect.y = i * 20;

      const r = (getRandomInt(0,255) / 255);
      const g = (getRandomInt(0,255) / 255);
      const b = (getRandomInt(0,255) / 255);

      rect.fills = [{type: 'SOLID', color: {r: r, g: g, b: b}}];
      figma.currentPage.appendChild(rect);
      nodes.push(rect);
    }
    figma.currentPage.selection = nodes;
    figma.viewport.scrollAndZoomIntoView(nodes);
  }

  if (msg.type === 'lawls') {
    console.log('hullo');
  }

  // Make sure to close the plugin when you're done. Otherwise the plugin will
  // keep running, which shows the cancel button at the bottom of the screen.
  if (msg.type !== 'lawls') {
    figma.closePlugin();    
  }
};
