declare namespace NodeJS {
  interface ProcessEnv {
    /** Optional fallback for admin tab title when `admin-branding.brandName` is empty (see AdminBrandingEffects). */
    NEXT_PUBLIC_ADMIN_BRAND_NAME?: string
  }
}
