<script>
  import { afterUpdate, beforeUpdate } from 'svelte';
  import ButtonSelect from './forms-controls/ButtonSelect';
  import FormUnit from './forms-controls/FormUnit';

  export let isSelected = false;
  export let itemId = null;
  export let role = 'no-role';
  export let type = null;
  export let labels = {
    a11y: '',
    visible: '',
    alt: '',
  };

  let resetValue = false;
  let dirtyRole = role;
  let originalRole = role;
  const dirtyLabels = { ...labels };
  const originalLabels = { ...labels };

  const controlRoles = [
    {
      value: 'no-role',
      text: 'Undefined…',
      disabled: false,
    },
    {
      value: 'divider--01',
      text: null,
      disabled: true,
    },
    {
      value: 'image',
      text: 'Image',
      disabled: false,
    },
    {
      value: 'image-decorative',
      text: 'Image (decorative)',
      disabled: false,
    },
    {
      value: 'divider--02',
      text: null,
      disabled: true,
    },
    {
      value: 'button',
      text: 'Button',
      disabled: false,
    },
    {
      value: 'checkbox',
      text: 'Checkbox',
      disabled: false,
    },
    {
      value: 'link',
      text: 'Link',
      disabled: false,
    },
    {
      value: 'menuitem',
      text: 'Menu item',
      disabled: false,
    },
    {
      value: 'menuitemcheckbox',
      text: 'Menu item (checkbox)',
      disabled: false,
    },
    {
      value: 'menuitemradio',
      text: 'Menu item (radio)',
      disabled: false,
    },
    {
      value: 'option',
      text: 'Option',
      disabled: false,
    },
    {
      value: 'progressbar',
      text: 'Progress bar',
      disabled: false,
    },
    {
      value: 'radio',
      text: 'Radio',
      disabled: false,
    },
    {
      value: 'searchbox',
      text: 'Search box',
      disabled: false,
    },
    {
      value: 'slider',
      text: 'Slider',
      disabled: false,
    },
    {
      value: 'switch',
      text: 'Switch',
      disabled: false,
    },
    {
      value: 'tab',
      text: 'Tab',
      disabled: false,
    },
    {
      value: 'tabpanel',
      text: 'Tab panel',
      disabled: false,
    },
    {
      value: 'textbox',
      text: 'Textbox',
      disabled: false,
    },
    {
      value: 'divider--03',
      text: null,
      disabled: true,
    },
    {
      value: 'combobox',
      text: 'Combobox',
      disabled: false,
    },
    {
      value: 'listbox',
      text: 'Listbox',
      disabled: false,
    },
    {
      value: 'menu',
      text: 'Menu',
      disabled: false,
    },
    {
      value: 'radiogroup',
      text: 'Radio group',
      disabled: false,
    },
    {
      value: 'tablist',
      text: 'Tab list',
      disabled: false,
    },
  ];

  const handleSelect = () => {
    // tktk
    console.log('select layer in Figma artboard'); // eslint-disable-line no-console
  };

  const updateLabel = (key) => {
    if (dirtyLabels[key] !== originalLabels[key]) {
      console.log(`update label from ${originalLabels[key]}`); // eslint-disable-line no-console
      // postMessage to update label(s) - probably all, since it accounts for initial setting
    }
  };

  const updateRole = () => {
    if (originalRole !== dirtyRole) {
      console.log(`update role from ${originalRole}`); // eslint-disable-line no-console
      // postMessage for role update
    }
  };

  beforeUpdate(() => {
    // check `role` against original to see if it was updated on the Figma side
    if (role !== dirtyRole) {
      dirtyRole = role;
      originalRole = role;
      resetValue = true;
    }

    // check labels against the original to see if any were updated on the Figma side
    const unsyncedLabels = Object.keys(labels).filter(key => labels[key] !== dirtyLabels[key]);
    unsyncedLabels.forEach((key) => {
      dirtyLabels[key] = labels[key];
      originalLabels[key] = labels[key];
      resetValue = true;
    });
  });

  afterUpdate(() => {
    if (resetValue) {
      resetValue = false;
    }
  });
</script>

<style>
  /* components/list-item-content */
</style>

<article class:isSelected class={`item-content ${type}`}>
  <span class="form-element-holder">
    <span class="form-row">
      <FormUnit
        className="form-inner-row"
        kind="inputSelect"
        labelText="Role"
        nameId={`${itemId}-role`}
        options={controlRoles}
        resetValue={resetValue}
        selectWatchChange={true}
        on:saveSignal={() => updateRole()}
        bind:value={dirtyRole}
      />
      <ButtonSelect
        on:handleUpdate={() => handleSelect()}
      />
    </span>
    {#if (role !== 'image-decorative')}
      {#if (role === 'image')}
        <FormUnit
          className="form-row"
          kind="inputText"
          labelText="Alt text"
          nameId={`${itemId}-label-alt`}
          options={controlRoles}
          placeholder="Short description of the scene"
          resetValue={resetValue}
          selectWatchChange={true}
          on:saveSignal={() => updateLabel('alt')}
          bind:value={dirtyLabels.alt}
        />
      {:else}
        <FormUnit
          className="form-row"
          kind="inputText"
          labelText="Visible label"
          nameId={`${itemId}-label-visible`}
          options={controlRoles}
          placeholder="Leave empty to use a11y label"
          resetValue={resetValue}
          selectWatchChange={true}
          on:saveSignal={() => updateLabel('visible')}
          bind:value={dirtyLabels.visible}
        />
        <FormUnit
          className="form-row"
          kind="inputText"
          labelText="A11y label"
          nameId={`${itemId}-label-a11y`}
          options={controlRoles}
          placeholder="Leave empty to use visible label"
          resetValue={resetValue}
          selectWatchChange={true}
          on:saveSignal={() => updateLabel('a11y')}
          bind:value={dirtyLabels.a11y}
        />
      {/if}
    {/if}
  </span>
</article>
