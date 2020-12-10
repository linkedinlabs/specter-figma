# Adding a plugin build to Figma

## Requirements

You must be using the Figma [desktop app](https://www.figma.com/downloads/). It is currently not possible to use local builds of a plugin through the web interface.

## Installation

1. Unzip the `Specter.figmaplugin.zip` file somewhere on your computer where you will be able to find it later.
2. Open the Figma desktop app
3. In Figma, at the top of the left-hand sidebar of your dashboard, click your name/avatar and then click “Plugins”
4. In the middle of screen, next to “Create your own plugin”, click the “plus” icon.
5. In the resulting modal, under “Link existing plugin”, click on “Click to choose a manifest.json file”
6. Navigate to the directory that you un-zipped and select the “manifest.json” file.

Once linked, do not move the directory containing the `manifest.json` file. If you do, you will need to re-link it by following the process above, starting with step 2.

## Usage

Local plugin builds are all accessed from the plugin development menu:

`Plugins > Development > [plugin-name]`

## Upgrading

To upgrade a local plugin build (and replace the old version):

1. Unzip the `Specter.figmaplugin.zip` file.
2. Copy the `dist` directory and `manifest.json` file.
3. Locate the directory where the current version of the plugin resides.
4. Replace the current versions of `dist` and `manifest.json` with the new ones.

To upgrade a local plugin build (and **keep** the old version):

Follow the installation instructions again. Once installed, you will see the new version of the plugin alongside the old version in the `Plugins > Development` menu.
