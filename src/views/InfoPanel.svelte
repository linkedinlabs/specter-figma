<script>
  import { createEventDispatcher } from 'svelte';
  import SpecterLogo from '../assets/images/SpecterLogo';

  export let isInternal = false;

  const dispatch = createEventDispatcher();
</script>

<section class="info-panel">
  <header>
    <SpecterLogo/>
    <h1>
      Specter
    </h1>
    <h4>
      {#if isInternal}
        for LinkedIn <br/>
        (Internal Build)
      {:else}
        ©2020 LinkedIn. <br/>
        All rights reserved.
      {/if}
    </h4>
  </header>
  <article>
    {#if isInternal}
      <p>Built by the Design Tools Team</p>
      <p>
        Join us in Slack: <br />
        #ued-tool-specter
      </p>
    {:else}
      <p>
        <a href="mailto:designtools@linkedin.com?subject=Specter Feedback" target="_blank">designtools@linkedin.com</a>
      </p>
      <ul>
        <li>
          <a href="https://www.linkedin.com/legal/eula" target="_blank">End User License Agreement</a>
        </li>
        <li>
          <a href="https://www.linkedin.com/legal/privacy-policy" target="_blank">Privacy Policy</a>
        </li>
      </ul>
    {/if}
  </article>
  <footer>
    <p class="form-actions">
      <button
        on:click={() => dispatch('handleAction', 'info-hide')}
        class="button button--secondary button--margin-right"
      >
        Back
      </button>
    </p>
  </footer>
</section>
