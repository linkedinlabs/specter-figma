# Development Setup

Big-picture background and technical notes for our Design Org Tools can be found in the [Engineering Wiki](https://go/designtools).

## Installation & Setup

1. Copy `.env.example` to `.env` and fill in the required variables
1. Copy `.plugin-id.example` to `.plugin-id` and replace “PLUGIN_ID” with the current plugin ID
1. Run `npm install` – this will install dependencies, generate the `manifest.json` file (based on `manifest.example.json`), and run `build`
1. Add the plugin’s fresh `manifest.json` to Figma’s desktop app (see `build-README-template.md` for instructions)
1. View the plugin in Figma’s “Development” sub-menu: “Plugins > Development > [Plugin name]”

## Running the plugin for development

`npm run watch` – Run during development to keep the latest changes built.

* _Note:_ The `manifest.json` file is re-generated each time `watch` is started and is not committed to the repo. Make menu/command updates to `manifest.example.json` and restart the process to see them reflected in the current build.
* If you want to watch a specific build target, you can specify it: `npm run watch:internal` or `npm run watch:public`. If not specified, the default is `:internal`.

### Linting

`npm run lint` – This will lint the whole plugin, running both `eslint` and `stylelint`.

* Commits are linted by looking at staged changes. Both `eslint` and `stylelint` are run.
* You may run `npm run lint:js` or `npm run lint:css` to individually target JS or CSS.
* Documentation errors (JSDoc style) are set up as warnings, not errors, so you may want to periodically check for them.

### Documentation

Follow the [JSDoc](https://jsdoc.app) style for documentation.

## Creating builds for publishing

`npm run build` – Run to build a production version of the plugin. Use this as a final step before publishing updates.

* Similar to `watch`, you may specify a build target: `npm run build:internal` or `npm run build:public`. If not specified, the default is `:internal`.

Once a new build is created, the updates can be published through Figma’s desktop app (see [the wiki](https://go/designtools) for further instructions).

## Technologies

### Typescript

This plugin uses [Typescript](https://www.typescriptlang.org). If you are familiar with Javascript, Typescript will
look very familiar. In fact, valid Javascript code is already valid Typescript code.

Figma maintains a [Typings File](https://www.figma.com/plugin-docs/api/typings/) npm package that is generally updated soon after API changes.

### Svelte

The UI for this plugin is built using [Svelte](https://svelte.dev). If you are familiar with React, Vue, or another state-based UI engine, Svelte will
look familiar and hopefully more simple.

The Svelte site contains an excellent [tutorial](https://svelte.dev/tutorial/basics) to quickly get up-to-speed on the basics.

### Sass

CSS for the UI takes advantage of [Sass](https://sass-lang.com).
