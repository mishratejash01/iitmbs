#!/usr/bin/env node
/**
 * Pulls the official lecture videos from the IIT Madras BS YouTube channel
 * through the YouTube Data API and stores them in lecture_videos. The site
 * embeds the videos with YouTube's player; nothing is downloaded.
 *
 *   npm run lectures:sync -- --list   list the channel's playlists (to map them)
 *   npm run lectures:sync             sync the playlists in scripts/lecture-playlists.json
 *
 * Needs YOUTUBE_API_KEY (a YouTube Data API v3 key) plus the Supabase
 * variables used by the other scripts. Re-running is safe: videos are
 * matched by their YouTube id, and ones that left a playlist are removed.
 */
import { readFile } from 'node:fs/promises'

import { parseLectureTitle } from '../src/lib/lectures/videos.ts'
import { runSql } from './supabase-sql.mjs'

const CHANNEL_ID = 'UCvKzzGO37oT83K0FwnUucxw' // IIT Madras - B.S. Degree Programme
const API = 'https://www.googleapis.com/youtube/v3'

const key = process.env.YOUTUBE_API_KEY
if (!key) throw new Error('Set YOUTUBE_API_KEY (a YouTube Data API v3 key).')

type Page<T> = { items?: T[]; nextPageToken?: string }

async function api<T>(path: string, params: Record<string, string>): Promise<T[]> {
  const items: T[] = []
  let pageToken = ''
  do {
    const query = new URLSearchParams({ ...params, key: key!, maxResults: '50' })
    if (pageToken) query.set('pageToken', pageToken)
    const response = await fetch(`${API}/${path}?${query}`)
    if (!response.ok)
      throw new Error(`YouTube ${path} failed (${response.status}): ${await response.text()}`)
    const body = (await response.json()) as Page<T>
    items.push(...(body.items ?? []))
    pageToken = body.nextPageToken ?? ''
  } while (pageToken)
  return items
}

type Playlist = { id: string; snippet: { title: string }; contentDetails: { itemCount: number } }
type PlaylistItem = {
  snippet: { title: string; position: number; resourceId: { videoId: string } }
  contentDetails: { videoId: string; videoPublishedAt?: string }
}
type Video = {
  id: string
  contentDetails: { duration: string }
  status: { embeddable: boolean; privacyStatus: string }
}

/** "PT1H2M5S" → 3725. */
function seconds(duration: string): number | null {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(duration)
  if (!match) return null
  return Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0)
}

const sql = (value: string | number | null) =>
  value === null
    ? 'null'
    : typeof value === 'number'
      ? String(value)
      : `'${value.replace(/'/g, "''")}'`

if (process.argv.includes('--list')) {
  const playlists = await api<Playlist>('playlists', {
    part: 'snippet,contentDetails',
    channelId: CHANNEL_ID,
  })
  for (const p of playlists.sort((a, b) => a.snippet.title.localeCompare(b.snippet.title))) {
    console.log(`${p.id}\t${String(p.contentDetails.itemCount).padStart(4)}\t${p.snippet.title}`)
  }
  console.log(`\n${playlists.length} playlists`)
  process.exit(0)
}

const mapping = JSON.parse(
  await readFile(new URL('./lecture-playlists.json', import.meta.url), 'utf8'),
) as Record<string, string>

let total = 0
for (const [playlistId, code] of Object.entries(mapping)) {
  const items = await api<PlaylistItem>('playlistItems', {
    part: 'snippet,contentDetails',
    playlistId,
  })
  const ids = items.map((item) => item.contentDetails.videoId)
  const videos = new Map<string, Video>()
  for (let i = 0; i < ids.length; i += 50) {
    const batch = await api<Video>('videos', {
      part: 'contentDetails,status',
      id: ids.slice(i, i + 50).join(','),
    })
    for (const video of batch) videos.set(video.id, video)
  }
  // Only public videos that allow embedding can play on the site.
  const rows = items.flatMap((item) => {
    const video = videos.get(item.contentDetails.videoId)
    if (!video || !video.status.embeddable || video.status.privacyStatus !== 'public') return []
    const parsed = parseLectureTitle(item.snippet.title)
    return [
      `(${[
        sql(item.contentDetails.videoId),
        sql(playlistId),
        sql(parsed.title.slice(0, 200)),
        sql(parsed.week),
        sql(parsed.lecture),
        sql(item.snippet.position),
        sql(seconds(video.contentDetails.duration)),
        sql(item.contentDetails.videoPublishedAt ?? null),
      ].join(', ')})`,
    ]
  })
  if (rows.length === 0) continue
  await runSql(`
    begin;
    with v (youtube_id, playlist_id, title, week, lecture, position, duration_seconds, uploaded_at) as (
      values ${rows.join(',\n')}
    ),
    course as (select id from public.note_courses where code = ${sql(code)} and deleted_at is null)
    insert into public.lecture_videos
      (note_course_id, youtube_id, playlist_id, title, week, lecture, position, duration_seconds, uploaded_at, is_published)
    select course.id, v.youtube_id, v.playlist_id, v.title, v.week::smallint, v.lecture, v.position,
           v.duration_seconds, v.uploaded_at::timestamptz, true
    from v cross join course
    on conflict (note_course_id, youtube_id) where deleted_at is null do update set
      playlist_id = excluded.playlist_id, title = excluded.title, week = excluded.week,
      lecture = excluded.lecture, position = excluded.position,
      duration_seconds = excluded.duration_seconds, uploaded_at = excluded.uploaded_at;
    delete from public.lecture_videos
    where playlist_id = ${sql(playlistId)}
      and youtube_id not in (${items.map((item) => sql(item.contentDetails.videoId)).join(', ')});
    commit;
  `)
  total += rows.length
  console.log(`${code}\t${rows.length} lectures\t${playlistId}`)
}
await runSql('select private.refresh_search_index(true);')
console.log(`Synced ${total} lectures.`)
