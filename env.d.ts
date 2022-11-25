/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HTTP_CLIENT_URL_PROD: string;
  readonly VITE_HTTP_CLIENT_URL_DEV: string;
  readonly VITE_I18N_LOCALE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
