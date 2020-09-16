import { writable } from 'svelte/store';

// writable
export const currentTask = writable(null);
export const isMercadoStored = writable(false);
export const viewContextStored = writable('general');
