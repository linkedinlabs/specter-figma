<script>
  import { compareArrays } from '../utils/tools';
  import FormUnit from './forms-controls/FormUnit';
  import { KEY_OPTS } from '../constants';

  export let isSelected = false;
  export let itemId = null;
  export let keys = null;
  export let type = null;

  let newKeyValue = 'no-key';
  let dirtyKeys = keys ? [...keys] : [];

  $: currentOptions = KEY_OPTS.reduce((acc, opt, i) => {
    // checks if current item is divider preceeded by another divider or at the end
    const isRedundantDivider = !opt.text && (!acc[acc.length - 1].text
      || !KEY_OPTS.slice(i).find(({ text, value }) => text && !dirtyKeys.includes(value))
    );

    if (!dirtyKeys.includes(opt.value) && !isRedundantDivider) {
      acc.push(opt);
    }
    return acc;
  }, []);

  const updateKeys = (action, value, index) => {
    let newKeys = [...dirtyKeys];

    if (action === 'delete') {
      newKeys = newKeys.filter(key => key !== value);
    } else if (action === 'update' && value !== dirtyKeys[index]) {
      value === 'no-key' ? newKeys.splice(index, 1) : newKeys[index] = value;
    } else if (action === 'add' && ![...newKeys, 'no-key'].includes(value)) {
      newKeys.push(value);
    }

    if (compareArrays(newKeys, dirtyKeys)) {
      parent.postMessage({
        pluginMessage: {
          action: 'a11y-set-node-data',
          payload: {
            id: itemId,
            key: 'keys',
            value: newKeys,
          },
        },
      }, '*');
      dirtyKeys = newKeys;
      newKeyValue = 'no-key';
    }
  };

</script>

<style>
  /* components/list-item-content */
</style>

<article class:isSelected class={`item-content ${type}`}>
  <ul class="keys-list">
    {#each dirtyKeys as dirtyKey, i (dirtyKey)}
      <li class="keys-item">
        <span class="form-element-holder">
          <FormUnit
            className="form-row"
            on:deleteSignal={() => updateKeys('delete', dirtyKey)}
            hideLabel={true}
            isDeletable={true}
            kind="inputSelect"
            labelText="Key"
            nameId={`${itemId}-key-${dirtyKey}`}
            options={[KEY_OPTS.find(opt => opt.value === dirtyKey), ...currentOptions.slice(1)]}
            selectWatchChange={true}
            on:saveSignal={() => updateKeys('update', dirtyKey, i)}
            bind:value={dirtyKey}
          />
        </span>
      </li>
    {/each}
    {#if currentOptions.length > 1}
      <li class="keys-item init">
        <span class="form-element-holder">
          <FormUnit
            className="form-row"
            hideLabel={true}
            kind="inputSelect"
            labelText="Key"
            nameId={`${itemId}-key-no-key`}
            options={currentOptions}
            selectWatchChange={true}
            on:saveSignal={() => updateKeys('add', newKeyValue)}
            bind:value={newKeyValue}
          />
        </span>
      </li>
    {/if}
  </ul>
</article>
