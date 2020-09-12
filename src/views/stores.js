import { writable } from 'svelte/store';

// writable
export const currentTask = writable(null);
export const isMercadoStored = writable(false); // eslint-disable-line import/prefer-default-export
