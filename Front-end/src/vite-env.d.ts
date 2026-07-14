/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the deployed API (e.g. https://xxx.onrender.com/api). Unset in dev. */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
