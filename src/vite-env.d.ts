/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * CORS proxy prefix used to fetch CHMI radar images (which lack CORS
   * headers). The image URL is URL-encoded and appended to this prefix.
   * Set to an empty string to disable proxying. Defaults to
   * "https://images.weserv.nl/?url=".
   */
  readonly VITE_CORS_PROXY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
