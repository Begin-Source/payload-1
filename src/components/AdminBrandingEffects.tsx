'use client'

import { useEffect } from 'react'

import { fetchAdminBranding } from '@/components/fetchAdminBranding'

const defaultTitleSuffix = ' | Admin'

/**
 * Applies CSS variables, document title, and favicon from public branding API.
 * Mounted from `AdminBrandingLogo` only so it runs once in the admin shell.
 */
export function AdminBrandingEffects(): null {
  useEffect(() => {
    let cancelled = false
    fetchAdminBranding()
      .then((branding) => {
        if (cancelled) return
        const root = document.documentElement
        if (branding.primaryColor) {
          root.setAttribute('data-admin-branding', 'true')
          root.style.setProperty('--admin-brand-primary', branding.primaryColor)
          root.style.setProperty(
            '--admin-brand-primary-hover',
            `color-mix(in srgb, ${branding.primaryColor} 82%, black)`,
          )
        } else {
          root.removeAttribute('data-admin-branding')
          root.style.removeProperty('--admin-brand-primary')
          root.style.removeProperty('--admin-brand-primary-hover')
        }
        if (branding.brandName) {
          document.title = `${branding.brandName}${defaultTitleSuffix}`
        }
        if (branding.logoUrl) {
          let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
          if (!link) {
            link = document.createElement('link')
            link.rel = 'icon'
            document.head.appendChild(link)
          }
          link.href = branding.logoUrl
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])
  return null
}
