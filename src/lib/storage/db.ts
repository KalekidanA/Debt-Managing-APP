import { del, get, set } from "idb-keyval";

const STATE_KEY = "zero:v1:app-state";

/** All data lives in IndexedDB on this device only — nothing is sent to a
 * server. IndexedDB (unlike localStorage) can store Dates and nested
 * objects directly via structured clone, so no manual JSON
 * serialization is needed. */
export async function loadAppState<T>(): Promise<T | undefined> {
  return get(STATE_KEY);
}

export async function saveAppState<T>(state: T): Promise<void> {
  await set(STATE_KEY, state);
}

export async function clearAppState(): Promise<void> {
  await del(STATE_KEY);
}
