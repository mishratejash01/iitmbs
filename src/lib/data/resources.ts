import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'

import { tableTag } from '@/lib/cache/tags'
import { coursePath } from '@/lib/routes'
import { getPublicClient } from '@/lib/supabase/public'

import { RESOURCE_COLUMNS, toResource } from './mappers'
import { getPrograms } from './programs'
import { contentCacheProfile } from './settings'
import type { ResourceItem } from './types'

export type ResourceGroup = {
  label: string
  path: string | null
  items: ResourceItem[]
}

/** Every live resource, grouped: site-wide links first, then per course. */
export async function getResourceGroups(): Promise<ResourceGroup[]> {
  'use cache'
  cacheLife(await contentCacheProfile())
  cacheTag(tableTag('resources'), tableTag('courses'), tableTag('programs'))

  const db = getPublicClient()
  const [resources, courses, programs] = await Promise.all([
    db.from('resources').select(RESOURCE_COLUMNS).order('sort_order'),
    db.from('courses').select('id, slug, name, program_id').order('sort_order'),
    getPrograms(),
  ])
  if (resources.error) {
    console.error('[data/resources] list failed:', resources.error.message)
    return []
  }

  const programSlug = new Map(programs.map((p) => [p.id, p.slug]))
  const courseInfo = new Map(
    (courses.data ?? []).flatMap((c) => {
      const slug = programSlug.get(c.program_id)
      return slug ? [[c.id, { label: c.name, path: coursePath(slug, c.slug) }] as const] : []
    }),
  )

  const general: ResourceItem[] = []
  const byCourse = new Map<string, ResourceItem[]>()
  for (const row of resources.data) {
    if (!row.course_id) {
      general.push(toResource(row))
    } else if (courseInfo.has(row.course_id)) {
      byCourse.set(row.course_id, [...(byCourse.get(row.course_id) ?? []), toResource(row)])
    }
  }

  const groups: ResourceGroup[] = []
  if (general.length > 0) groups.push({ label: 'Official links', path: null, items: general })
  for (const [courseId, items] of byCourse) {
    const info = courseInfo.get(courseId)!
    groups.push({ label: info.label, path: info.path, items })
  }
  return groups
}

export type DownloadTarget = {
  id: string
  kind: 'pdf' | 'sheet' | 'link' | 'video'
  title: string
  url: string | null
  cloudinaryPublicId: string | null
  cloudinaryResourceType: 'image' | 'raw' | 'video' | null
  fileFormat: string | null
  requiresLogin: boolean
}

/**
 * Fresh (uncached) lookup for /api/download so an unpublished or deleted
 * resource stops being downloadable immediately. RLS limits it to live rows.
 */
export async function getDownloadTarget(id: string): Promise<DownloadTarget | null> {
  const { data, error } = await getPublicClient()
    .from('resources')
    .select('id, kind, title, url, cloudinary_public_id, cloudinary_resource_type, file_format, requires_login')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('[data/resources] download lookup failed:', error.message)
    return null
  }
  if (!data) return null
  return {
    id: data.id,
    kind: data.kind,
    title: data.title,
    url: data.url,
    cloudinaryPublicId: data.cloudinary_public_id,
    cloudinaryResourceType: data.cloudinary_resource_type as DownloadTarget['cloudinaryResourceType'],
    fileFormat: data.file_format,
    requiresLogin: data.requires_login,
  }
}
