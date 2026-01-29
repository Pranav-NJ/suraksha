/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_WS_URL: string
  readonly VITE_STUN_URLS: string
  readonly VITE_TURN_URL: string
  readonly VITE_TURN_USERNAME: string
  readonly VITE_TURN_CREDENTIAL: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly more: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
