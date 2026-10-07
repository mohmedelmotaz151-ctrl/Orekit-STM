/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly api_key?: string;
  readonly auth_domain?: string;
  readonly project_id?: string;
  readonly storage_bucket?: string;
  readonly messaging_sender_id?: string;
  readonly app_id?: string;
  readonly vapid_key?: string;
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_FIREBASE_VAPID_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
