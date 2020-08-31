<script>
  export let isMercadoMode = false;
</script>
<section id="main">
  {#if isMercadoMode}
    <header class="mercado-banner" style="display: none;">
      <h2>Mercado Mode Enabled</h2>
    </header>
  {/if}
  <nav id="actions">
    <ul>
      <li>
        <button id="annotate">
          <span class="icon">
            <svg viewBox="0 0 21 18" class="icons-annotate">
              <path d="M2,13H8.17l2.39,2.32L13.4,13H19V2H2ZM0,0H21V15H14.11l-3.66,3L7.36,15H0Z"/>
            </svg>
          </span>
          <span class="text">
            Annotate
          </span>
        </button>
      </li>
      <li>
        <button id="measure">
          <span class="icon">
            <svg viewBox="0 0 19 18" class="icons-measure">
              <polygon points="12 18 10 18 10 9 0 9 0 7 12 7 12 18"/>
              <polygon points="6 5 7 5 7 6 4 6 4 5 5 5 5 1 4 1 4 0 7 0 7 1 6 1 6 5"/>
              <polygon points="14 13 14 14 13 14 13 11 14 11 14 12 18 12 18 11 19 11 19 14 18 14 18 13 14 13"/>
            </svg>
          </span>
          <span class="text">
            Measure
          </span>
        </button>
      </li>
      <li>
        <button id="corners" style="display: none;">
          <span class="icon">
            <svg viewBox="0 0 25 20" class="icons-corners">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M24.5 3H8.5C5.46243 3 3 5.46243 3 8.5V19.5H0.5V8.5C0.5 4.08172 4.08172 0.5 8.5 0.5H24.5V3Z" fill="black"/>
            </svg>
          </span>
          <span class="text">
            Corners
          </span>
        </button>
      </li>
      <li>
        <button id="bounding">
          <span class="icon">
            <svg viewBox="0 0 21 18" class="icons-bounding">
              <path d="M2,16H19V2H2ZM0,0H21V18H0Z"/>
              <rect width="21" height="18"/>
            </svg>
          </span>
          <span class="text">
            Bounding Box
          </span>
        </button>
      </li>
    </ul>
  </nav>
</section>
