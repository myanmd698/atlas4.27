/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_BILLING_API?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
