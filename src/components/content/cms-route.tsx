import type { Metadata } from 'next'

import { getChildPages, getPage } from '@/lib/data/pages'
import { redirectOrNotFound } from '@/lib/data/redirects'
import { getSeoOverrides } from '@/lib/data/seo-overrides'
import { getSiteSettings } from '@/lib/data/settings'
import type { Crumb } from '@/lib/seo/jsonld'
import { buildMetadata } from '@/lib/seo/metadata'

import { CmsPageView } from './cms-page-view'

export async function cmsMetadata(path: string): Promise<Metadata> {
  const [page, settings, overrides] = await Promise.all([
    getPage(path),
    getSiteSettings(),
    getSeoOverrides(),
  ])
  if (!page) return { robots: { index: false } }
  return buildMetadata({
    settings,
    path: `/${page.path}`,
    template: 'page',
    vars: { page: page.title },
    fallbackTitle: `${page.title} | ${settings.site_name}`,
    fallbackDescription: page.summary ?? page.title,
    seo: page.seo,
    override: overrides[`/${page.path}`],
    type: page.template === 'legal' ? 'website' : 'article',
    publishedTime: page.publishedAt,
    modifiedTime: page.updatedAt,
  })
}

/** Renders the CMS page at `path`, with breadcrumbs built from its parents. */
export async function CmsRoute({
  path,
  listChildren = false,
}: {
  path: string
  listChildren?: boolean
}) {
  const page = await getPage(path)
  if (!page) return redirectOrNotFound(`/${path}`)

  const segments = path.split('/')
  const crumbs: Crumb[] = []
  for (let i = 1; i < segments.length; i++) {
    const parentPath = segments.slice(0, i).join('/')
    const parent = await getPage(parentPath)
    if (parent)
      crumbs.push({ name: parent.title.split(':')[0] ?? parent.title, path: `/${parent.path}` })
  }
  crumbs.push({ name: page.title.split(':')[0] ?? page.title, path: `/${page.path}` })

  const childPages = listChildren ? await getChildPages(path) : []
  return <CmsPageView page={page} crumbs={crumbs} childPages={childPages} />
}
