// This plugin will open a modal to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs in the <script> tag inside "webview.html" which has a
// full browser enviroment (see documentation).

const getRandomInt = (min: number, max: number): number => {
  const setMin = Math.ceil(min);
  const setMax = Math.floor(max);
  const num = Math.floor(Math.random() * (setMax - setMin + 1)) + setMin;
  return num;
};

// This shows the HTML page in "webview.html".
figma.showUI(__html__, { width: 140, height: 180 }); // eslint-disable-line no-undef

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = (msg): void => {
  // One way of distinguishing between different types of messages sent from
  // your HTML page is to use an object with a "type" property like this.
  if (msg.type === 'create-rectangles') {
    const nodes: SceneNode[] = [];
    for (
      let i = 0; i < msg.count; i += 1
    ) {
      const rect = figma.createRectangle();
      rect.x = i * 20;
      rect.y = i * 20;

      const r = (getRandomInt(0, 255) / 255);
      const g = (getRandomInt(0, 255) / 255);
      const b = (getRandomInt(0, 255) / 255);

      rect.fills = [{
        type: 'SOLID',
        color: { r, g, b },
      }];
      figma.currentPage.appendChild(rect);
      nodes.push(rect);
    }
    figma.currentPage.selection = nodes;
    figma.viewport.scrollAndZoomIntoView(nodes);
  }

  if (msg.type === 'lawls') {
    console.log('hullo');
    figma.ui.resize(300, 400);
  }
};
