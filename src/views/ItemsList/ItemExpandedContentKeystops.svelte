<script>
  import { KEY_OPTS } from '../../constants';
  import { compareArrays } from '../../utils/tools';
  import FormUnit from '../forms-controls/FormUnit';

  export let isSelected = false;
  export let itemId = null;
  export let type = null;
  export let keys;

  let newKeyValue = 'no-key';
  const savedKeys = [...keys];

  $: currentOptions = KEY_OPTS.reduce((acc, opt, i) => {
    // checks if current item is divider preceeded by another divider or at the end
    const isRedundantDivider = !opt.text && (!acc[acc.length - 1].text
      || !KEY_OPTS.slice(i).find(({ text, value }) => text && !keys.includes(value))
    );
    if (!keys.includes(opt.value) && !isRedundantDivider) {
      acc.push(opt);
    }
    return acc;
  }, []);

  const updateKeys = (action, value) => {
    const changeDetected = compareArrays(keys, savedKeys);

    if (action === 'delete') {
      keys = keys.filter(key => key !== value);
    } else if (action === 'add' && ![...keys, 'no-key'].includes(value)) {
      keys = [...keys, value];
    }

    if (changeDetected) {
      parent.postMessage({
        pluginMessage: {
          action: 'a11y-set-node-data',
          payload: {
            id: itemId,
            key: 'keys',
            value: keys,
          },
        },
      }, '*');
      newKeyValue = 'no-key';
    }
  };

</script>

<style>
  /* components/list-item-content */
</style>

<article class:isSelected class={`item-content ${type}`}>
  <ul class="keys-list">
    {#each keys as key, i (key)}
      <li class="keys-item">
        <span class="form-element-holder">
          <FormUnit
            className="form-row"
            on:deleteSignal={() => updateKeys('delete', key)}
            hideLabel={true}
            isDeletable={true}
            kind="inputSelect"
            labelText="Key"
            nameId={`${itemId}-key-${key}`}
            options={[KEY_OPTS.find(opt => opt.value === key), ...currentOptions.slice(1)]}
            selectWatchChange={true}
            bind:value={key}
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
