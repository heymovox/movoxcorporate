/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_GA_MEASUREMENT_ID?: string;
  /** Set to "true" at build time to force the public site into maintenance
   *  mode even when the API cannot be reached. */
  readonly VITE_MAINTENANCE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
