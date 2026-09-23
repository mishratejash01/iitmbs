import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'

import { tableTag } from '@/lib/cache/tags'
import { getPublicClient } from '@/lib/supabase/public'

import { toFaq } from './mappers'
import { contentCacheProfile } from './settings'
import type { Faq } from './types'

/** Site-wide FAQs (shown on the qualifier hub and home page). */
export async function getGlobalFaqs(): Promise<Faq[]> {
  'use cache'
  cacheLife(await contentCacheProfile())
  cacheTag(tableTag('faqs'))

  const { data, error } = await getPublicClient()
    .from('faqs')
    .select('id, question, answer_mdx')
    .eq('scope', 'global')
    .order('sort_order')

  if (error) {
    console.error('[data/faqs] global faqs failed:', error.message)
    return []
  }
  return data.map(toFaq)
}
