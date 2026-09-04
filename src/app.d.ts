// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  // Injected by Vite `define` (vite.config.ts). Kept separate: the dirty flag
  // must never be baked into the SHA string, or the source-archive link would
  // point at an artefact that does not exist.
  const __COMMIT_SHA__: string;
  const __BUILD_DIRTY__: boolean;

  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    interface PageState {
      /**
       * Set by src/lib/ui/Coverflow.svelte through a shallow pushState when
       * the centre pad is chosen. It lives in the history entry rather than
       * in a component boolean so that the browser Back button and Escape are
       * one gesture rather than two implementations of it (D-09, W-16).
       */
      chosen?: boolean;
    }
    // interface Platform {}
  }
}

export {};
