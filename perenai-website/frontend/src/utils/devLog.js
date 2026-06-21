/** Logs only in Vite development builds. */
export function devLog(...args) {
  if (import.meta.env.DEV) {
    console.error(...args);
  }
}
