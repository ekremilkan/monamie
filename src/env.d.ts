/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly PUBLIC_API_BASE_URL?: string;
  readonly PUBLIC_API_PORT?: string;
  readonly PUBLIC_STRIPE_PUBLISHABLE_KEY?: string;
  readonly PUBLIC_GOOGLE_MAPS_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
