import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'

import { tableTag } from '@/lib/cache/tags'
import { getPublicClient } from '@/lib/supabase/public'

export type NavItem = {
  id: string
  label: string
  href: string
  description: string | null
  openInNewTab: boolean
  /** Items shown in this item's dropdown (nav_items.parent_id), in order. */
  children: NavItem[]
}

export type FooterGroup = {
  label: string
  links: Array<{ id: string; label: string; href: string; openInNewTab: boolean }>
}

export async function getNavItems(location: 'header' | 'mobile' | 'quick'): Promise<NavItem[]> {
  'use cache'
  cacheLife('settings')
  cacheTag(tableTag('nav_items'))

  const { data, error } = await getPublicClient()
    .from('nav_items')
    .select('id, label, href, description, open_in_new_tab, parent_id')
    .eq('location', location)
    .order('sort_order')

  if (error) {
    console.error('[data/navigation] nav items unavailable:', error.message)
    return []
  }
  const items = new Map(
    data.map((row) => [
      row.id,
      {
        id: row.id,
        label: row.label,
        href: row.href,
        description: row.description,
        openInNewTab: row.open_in_new_tab,
        children: [] as NavItem[],
      },
    ]),
  )
  // One level of dropdowns: children of a missing or inactive parent are dropped.
  const top: NavItem[] = []
  for (const row of data) {
    const item = items.get(row.id)
    if (!item) continue
    if (!row.parent_id) top.push(item)
    else items.get(row.parent_id)?.children.push(item)
  }
  return top
}

export async function getFooterGroups(): Promise<FooterGroup[]> {
  'use cache'
  cacheLife('settings')
  cacheTag(tableTag('footer_links'))

  const { data, error } = await getPublicClient()
    .from('footer_links')
    .select('id, group_label, group_order, label, href, open_in_new_tab')
    .order('group_order')
    .order('sort_order')

  if (error) {
    console.error('[data/navigation] footer links unavailable:', error.message)
    return []
  }

  const groups = new Map<string, FooterGroup>()
  for (const row of data) {
    const group = groups.get(row.group_label) ?? { label: row.group_label, links: [] }
    group.links.push({
      id: row.id,
      label: row.label,
      href: row.href,
      openInNewTab: row.open_in_new_tab,
    })
    groups.set(row.group_label, group)
  }
  return [...groups.values()]
}
