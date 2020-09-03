<script>
  import ButtonAction from './ButtonAction';

  export let showMercadoMode = false;
</script>

<section class="main-container">
  {#if showMercadoMode}
    <header class="mercado-banner">
      <h2>Mercado Mode Enabled</h2>
    </header>
  {/if}
  <nav>
    <ul>
      <li>
        <ButtonAction
          on:handleAction
          action="annotate"
          text="Annotate"
        >
          <svg viewBox="0 0 21 18" class="icons-annotate">
            <path d="M2,13H8.17l2.39,2.32L13.4,13H19V2H2ZM0,0H21V15H14.11l-3.66,3L7.36,15H0Z"/>
          </svg>
        </ButtonAction>
      </li>
      <li>
        <ButtonAction
          on:handleAction
          action="measure"
          text="Measure"
        >
          <svg viewBox="0 0 19 18" class="icons-measure">
            <polygon points="12 18 10 18 10 9 0 9 0 7 12 7 12 18"/>
            <polygon points="6 5 7 5 7 6 4 6 4 5 5 5 5 1 4 1 4 0 7 0 7 1 6 1 6 5"/>
            <polygon points="14 13 14 14 13 14 13 11 14 11 14 12 18 12 18 11 19 11 19 14 18 14 18 13 14 13"/>
          </svg>
        </ButtonAction>
      </li>
      {#if showMercadoMode}
        <li>
          <ButtonAction
            on:handleAction
            action="corners"
            text="Corners"
          >
            <svg viewBox="0 0 25 20" class="icons-corners">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M24.5 3H8.5C5.46243 3 3 5.46243 3 8.5V19.5H0.5V8.5C0.5 4.08172 4.08172 0.5 8.5 0.5H24.5V3Z" fill="black"/>
            </svg>
          </ButtonAction>
        </li>
      {/if}
      <li>
        <ButtonAction
          on:handleAction
          action="bounding"
          text="Bounding Box"
        >
          <svg viewBox="0 0 21 18" class="icons-bounding">
            <path d="M2,16H19V2H2ZM0,0H21V18H0Z"/>
            <rect width="21" height="18"/>
          </svg>
        </ButtonAction>
      </li>
    </ul>
  </nav>
</section>
