import type { MetadataRoute } from 'next'
import { headers } from 'next/headers.js'

import { getPublicBaseUrlFromHeaders } from '@/utilities/seoDocumentMeta'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers()
  const baseUrl = getPublicBaseUrlFromHeaders(headersList)
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: baseUrl ? `${baseUrl}/sitemap.xml` : undefined,
  }
}
