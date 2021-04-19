<script>
  import ButtonAction from './forms-controls/ButtonAction';

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
      <li>
        <ButtonAction
          on:handleAction
          action="show-page-input"
          text="Generate Spec Template"
        >
        <svg viewBox="0 0 21 21" width="21" height="21">
          <style>
            .icons-generate { fill: #000000; } 
          </style>
          <path id="Layer 7" class="icons-generate" d="M9 6L13.5 6L13.5 10.88C13.5 11.19 13.61 11.45 13.83 11.67C14.05 11.89 14.31 12 14.62 12L19.5 12L19.5 19.5L9 19.5L9 6ZM11.89 2.89C11.81 2.96 11.73 3 11.62 3L3.37 3C3.27 3 3.19 2.96 3.11 2.89C3.04 2.81 3 2.73 3 2.63L3 1.88C3 1.77 3.04 1.69 3.11 1.61C3.19 1.54 3.27 1.5 3.37 1.5L11.62 1.5C11.73 1.5 11.81 1.54 11.89 1.61C11.96 1.69 12 1.77 12 1.88L12 2.63C12 2.73 11.96 2.81 11.89 2.89ZM15 7L18.5 10.5L15 10.5L15 7ZM20.77 10.97C20.61 10.59 20.42 10.3 20.2 10.08L15.42 5.3C15.3 5.18 15.16 5.07 15 4.97L15 1.12C15 0.81 14.89 0.55 14.67 0.33C14.45 0.11 14.19 0 13.87 0L1.12 0C0.81 0 0.55 0.11 0.33 0.33C0.11 0.55 0 0.81 0 1.12L0 16.88C0 17.19 0.11 17.45 0.33 17.67C0.55 17.89 0.81 18 1.12 18L7.5 18L7.5 19.88C7.5 20.19 7.61 20.45 7.83 20.67C8.05 20.89 8.31 21 8.62 21L19.88 21C20.19 21 20.45 20.89 20.67 20.67C20.89 20.45 21 20.19 21 19.88L21 12C21 11.69 20.92 11.34 20.77 10.97Z" />
        </svg>
        </ButtonAction>
      </li>
      <li>
        <ButtonAction
          on:handleAction
          action="lock"
          text="Lock/Unlock All Annotations"
        >
        <svg viewBox="0 0 21 21" width="21" height="23">
          <style>
            .icons-lock { fill: #888; stroke: #000; stroke-width: 1.75px; } 
          </style>
          <path id="Layer 2" fill-rule="evenodd" class="icons-lock" d="M18.48 10.9L18.48 18.12C18.48 18.45 18.35 18.73 18.09 18.97C17.83 19.2 17.52 19.32 17.15 19.32L3.85 19.32C3.48 19.32 3.17 19.2 2.91 18.97C2.65 18.73 2.52 18.45 2.52 18.12L2.52 10.9C2.52 10.57 2.65 10.28 2.91 10.05C3.17 9.81 3.48 9.7 3.85 9.7L4.29 9.7L4.29 7.29C4.29 5.75 4.91 4.44 6.12 3.33C7.34 2.23 8.8 1.68 10.5 1.68C12.2 1.68 13.66 2.23 14.88 3.33C16.09 4.44 16.71 5.75 16.71 7.29L16.71 9.7L17.15 9.7C17.52 9.7 17.83 9.81 18.09 10.05C18.35 10.28 18.48 10.57 18.48 10.9ZM6.96 9.7L14.04 9.7L14.04 7.29C14.04 6.41 13.7 5.65 13.01 5.02C12.31 4.4 11.48 4.08 10.5 4.08C9.52 4.08 8.69 4.4 7.99 5.02C7.3 5.65 6.96 6.41 6.96 7.29L6.96 9.7Z" />        </svg>
        </ButtonAction>
      </li>
      <li>
        <ButtonAction
          on:handleAction
          action="show-color-input"
          text="Change Color"
        >
        <svg viewBox="0 0 21 21" width="24" height="24">
          <style>
            .icons-color { fill: #000000; } 
          </style>
          <path id="Layer 8" class="icons-color" d="M16.1 2.51L10.04 8.01C9.46 8.54 9.17 9.21 9.17 10.02C9.17 10.82 9.46 11.51 10.03 12.1C10.6 12.68 11.29 12.98 12.09 12.98C12.85 12.98 13.54 12.69 14.16 12.11C15 11.33 16.47 8.96 18.57 4.98C18.86 4.42 19 3.94 19 3.55C19 3.1 18.83 2.74 18.5 2.44C18.17 2.15 17.78 2 17.34 2C16.89 2 16.48 2.17 16.1 2.51L16.1 2.51ZM7.52 11.91C7.19 11.96 6.86 12.04 6.54 12.15C6.22 12.26 5.94 12.41 5.7 12.6C5.47 12.79 5.25 13.03 5.04 13.32C4.84 13.62 4.66 13.97 4.5 14.39C4.41 14.62 4.23 14.74 3.98 14.74C3.88 14.74 3.73 14.69 3.54 14.58C3.34 14.47 3.16 14.36 2.98 14.23C2.8 14.11 2.6 13.97 2.39 13.81C2.17 13.65 2.04 13.56 2 13.53C2 14.27 2.09 14.97 2.28 15.61C2.46 16.26 2.73 16.84 3.1 17.35C3.46 17.86 3.94 18.26 4.55 18.56C5.15 18.85 5.84 19 6.62 19C7.98 19 9.08 18.58 9.93 17.73C10.77 16.88 11.18 15.78 11.16 14.44L11.15 13.76C10.62 13.62 10.14 13.38 9.72 13.04C9.29 12.7 8.95 12.29 8.71 11.81C8.24 11.83 7.85 11.86 7.52 11.91Z" />
        </svg>
        </ButtonAction>
      </li>
      <li>
        <ButtonAction
          on:handleAction
          action="show-pointer-input"
          text="Change Pointer Direction"
        >
        <svg viewBox="0 0 21 21" width="21" height="21">
          <style>
            .icons-pointer { fill: #111111; } 
          </style>
          <path id="Layer 3" class="icons-pointer" d="M20.78 9.97L17.78 6.97C17.63 6.82 17.45 6.75 17.25 6.75C17.05 6.75 16.87 6.82 16.72 6.97C16.57 7.12 16.5 7.3 16.5 7.5L16.5 9L12 9L12 4.5L13.5 4.5C13.7 4.5 13.88 4.43 14.03 4.28C14.18 4.13 14.25 3.95 14.25 3.75C14.25 3.55 14.18 3.37 14.03 3.22L11.03 0.22C10.88 0.07 10.7 0 10.5 0C10.3 0 10.12 0.07 9.97 0.22L6.97 3.22C6.82 3.37 6.75 3.55 6.75 3.75C6.75 3.95 6.82 4.13 6.97 4.28C7.12 4.43 7.3 4.5 7.5 4.5L9 4.5L9 9L4.5 9L4.5 7.5C4.5 7.3 4.43 7.12 4.28 6.97C4.13 6.82 3.95 6.75 3.75 6.75C3.55 6.75 3.37 6.82 3.22 6.97L0.22 9.97C0.07 10.12 0 10.3 0 10.5C0 10.7 0.07 10.88 0.22 11.03L3.22 14.03C3.37 14.18 3.55 14.25 3.75 14.25C3.95 14.25 4.13 14.18 4.28 14.03C4.43 13.88 4.5 13.7 4.5 13.5L4.5 12L9 12L9 16.5L7.5 16.5C7.3 16.5 7.12 16.57 6.97 16.72C6.82 16.87 6.75 17.05 6.75 17.25C6.75 17.45 6.82 17.63 6.97 17.78L9.97 20.78C10.12 20.93 10.3 21 10.5 21C10.7 21 10.88 20.93 11.03 20.78L14.03 17.78C14.18 17.63 14.25 17.45 14.25 17.25C14.25 17.05 14.18 16.87 14.03 16.72C13.88 16.57 13.7 16.5 13.5 16.5L12 16.5L12 12L16.5 12L16.5 13.5C16.5 13.7 16.57 13.88 16.72 14.03C16.87 14.18 17.05 14.25 17.25 14.25C17.45 14.25 17.63 14.18 17.78 14.03L20.78 11.03C20.93 10.88 21 10.7 21 10.5C21 10.3 20.93 10.12 20.78 9.97L20.78 9.97Z" />
        </svg>
        </ButtonAction>
      </li>
    </ul>
  </nav>
</section>
