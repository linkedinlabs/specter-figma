import { writable } from 'svelte/store';

// writable
export const currentTask = writable(null);
export const isMercadoStored = writable(false);
export const openItems = writable([]);
export const sessionKey = writable(null);
export const viewContextStored = writable(null);
