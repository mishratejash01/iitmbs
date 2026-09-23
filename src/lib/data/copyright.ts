import 'server-only'

import { cacheLife } from 'next/cache'

import { yearInIst } from '@/lib/utils/dates'

/** Current year for the footer, cached so pages stay static. */
export async function getCopyrightYear(): Promise<number> {
  'use cache'
  cacheLife('days')
  return yearInIst()
}
