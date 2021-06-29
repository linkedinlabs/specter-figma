<script>
  export let name;
  export let width = '1rem';
  export let height = '1rem';
  export let clickable = false;
  export let focusable = false;
  export let active;

  const icons = [
    {
      box: [24, 20],
      name: 'orientation-up',
      svg: `<path class="${$$props.class}" d="M2.28564 14.4445H9.33707L12.0685 17.0222L15.3142 14.4445H21.7142V2.22223H2.28564V14.4445Z"/><path d="M2.28571 14.4444H9.33714L12.0686 17.0222L15.3143 14.4444H21.7143V2.22222H2.28571V14.4444ZM0 0H24V16.6667H16.1257L11.9429 20L8.41143 16.6667H0V0Z" fill="black"/>`,
    },
    {
      box: [24, 20],
      name: 'orientation-down',
      svg: `<path class="${$$props.class}" d="M2.28564 5.55555H9.33707L12.0685 2.97777L15.3142 5.55555H21.7142V17.7778H2.28564V5.55555Z"/><path d="M2.28571 5.55556H9.33714L12.0686 2.97778L15.3143 5.55556H21.7143V17.7778H2.28571V5.55556ZM0 20H24V3.33333H16.1257L11.9429 0L8.41143 3.33333H0V20Z" fill="black"/>`,
    },
    {
      box: [27, 20],
      name: 'orientation-left',
      svg: `<path class="${$$props.class}" fill-rule="evenodd" clip-rule="evenodd" d="M24.1366 9.99995L21.4672 6.7964V2.19995H2.2002V17.8H21.4672V13.2035L24.1366 9.99995Z"/><path fill-rule="evenodd" clip-rule="evenodd" d="M23.667 6V0H0V20H23.667V14L27 10L23.667 6ZM24.1364 10L21.467 6.79645V2.2H2.2V17.8H21.467V13.2036L24.1364 10Z" fill="black"/>`,
    },
    {
      box: [27, 20],
      name: 'orientation-right',
      svg: `<path class="${$$props.class}" fill-rule="evenodd" clip-rule="evenodd" d="M5.53313 6.79646L2.86377 10L5.53313 13.2036V17.8H24.8001V2.20001H5.53313V6.79646Z"/><path fill-rule="evenodd" clip-rule="evenodd" d="M5.533 6.79645L2.86364 10L5.533 13.2036V17.8H24.8V2.2H5.533V6.79645ZM3.333 0H27V20H3.333V14L0 10L3.333 6V0Z" fill="black"/>`,
    },
    {
      box: [18, 14],
      name: 'center-design',
      svg: '<path fill-rule="evenodd" clip-rule="evenodd" d="M2 0H0V2H2V0ZM18 0H16V2H18V0ZM4 1H5V2H4V1ZM2 4H1V5H2V4ZM16 4H17V5H16V4ZM2 6.5H1V7.5H2V6.5ZM16 6.5H17V7.5H16V6.5ZM2 9H1V10H2V9ZM16 9H17V10H16V9ZM5 12H4V13H5V12ZM7 1H8V2H7V1ZM8 12H7V13H8V12ZM10 1H11V2H10V1ZM11 12H10V13H11V12ZM13 1H14V2H13V1ZM14 12H13V13H14V12ZM2 12V14H0V12H2ZM18 12H16V14H18V12Z" fill="#18A0FB"/>',
    },
  ];

  const displayIcon = icons.find(e => e.name === name);
</script>

<style>
  .orientation-icon {
    fill: #fff;
  }

  .orientation-icon.active {
    fill: #000;
  }

  .clickable {
    padding: 4px;
  }

  .clickable:hover {
    background: rgba(128, 128, 128, 0.1);
    border-radius: 2px;
    cursor: pointer;
  }

  .clickable:hover .orientation-icon {
    fill: #D5ECFF;
  }
</style>

<div class:clickable style={`width: ${width}px; height: ${height}px`}>
  <svg
    class={$$props.class}
    class:active
    {focusable}

    viewBox="0 0 {displayIcon.box[0]} {displayIcon.box[1]}">{@html displayIcon.svg}
  </svg>
</div>