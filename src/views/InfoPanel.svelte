<script>
  import { createEventDispatcher } from 'svelte';

  export let isInternal = false;

  const dispatch = createEventDispatcher();
</script>

<section id="infoPanel">
  <header>
    <svg viewBox="0 0 270 360">
      <path d="M202.645579,269.564282 L135.097052,359.419042 L67.5485262,269.564282 L1.36424205e-12,314.491662 L1.36424205e-12,269.564282 L1.36424205e-12,135.097052 C1.326683e-12,60.4850106 60.4850106,1.37060097e-14 135.097052,0 C209.709094,-1.37060097e-14 270.194105,60.4850106 270.194105,135.097052 L270.194105,269.564282 L270.194105,314.491662 L202.645579,269.564282 Z" id="Combined-Shape" fill="#3399FF"></path>
      <ellipse fill="#FFFFFF" cx="73.1775701" cy="134.782141" rx="45.0323508" ry="44.9273803"></ellipse>
      <ellipse fill="#FF3399" cx="84.4356578" cy="146.013986" rx="16.8871316" ry="16.8477676"></ellipse>
      <ellipse fill="#FFFFFF" cx="197.016535" cy="134.782141" rx="45.0323508" ry="44.9273803"></ellipse>
      <ellipse fill="#FF3399" cx="208.274623" cy="146.013986" rx="16.8871316" ry="16.8477676"></ellipse>
      <path d="M101.322789,207.789134 L168.871316,207.789134 L168.871316,196.557289 L180.129403,196.557289 L180.129403,230.252824 L168.871316,230.252824 L168.871316,219.020979 L101.322789,219.020979 L101.322789,230.252824 L90.0647017,230.252824 L90.0647017,196.557289 L101.322789,196.557289 L101.322789,207.789134 Z" id="Combined-Shape" fill="#FFFFFF"></path>
    </svg>
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
        id="info-hide">
          Back
      </button>
    </p>
  </footer>
</section>
