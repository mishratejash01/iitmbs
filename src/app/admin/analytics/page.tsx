import Link from 'next/link'

import { refreshRollups } from '@/app/admin/actions'
import { BarList, Funnel, StatTile } from '@/components/admin/charts/bars'
import { LineChart } from '@/components/admin/charts/line-chart'
import { formatValue } from '@/components/admin/charts/scale'
import { AdminHeader, Notice, Panel, Table, inputClasses } from '@/components/admin/ui'
import { buttonClasses } from '@/components/ui/button'
import {
  TREND_METRICS,
  VITAL_THRESHOLDS,
  getContentPerformance,
  getFunnel,
  getMovers,
  getResourceTitles,
  getSeries,
  getTop,
  getTotals,
  getWebVitals,
  vitalRating,
  type VitalName,
} from '@/lib/admin/analytics'
import { RANGE_PRESETS, resolveRange, todayIn } from '@/lib/admin/range'
import { requireAdmin } from '@/lib/auth/session'
import { getSiteSettings } from '@/lib/data/settings'
import { cn } from '@/lib/utils/cn'

// Admin-only and always fresh: renders on request, never from a prefetch.
export const instant = false

const one = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value) ?? undefined

const PROPER_NAMES: Record<string, string> = {
  whatsapp: 'WhatsApp',
  youtube: 'YouTube',
  duckduckgo: 'DuckDuckGo',
  linkedin: 'LinkedIn',
  chatgpt: 'ChatGPT',
}

// Sources are search engines, social apps, "referral:<host>", UTM sources or direct.
function sourceLabel(source: string): string {
  if (source === 'direct') return 'Direct or unknown'
  if (source.startsWith('referral:')) return source.slice('referral:'.length)
  return PROPER_NAMES[source] ?? source[0]!.toUpperCase() + source.slice(1)
}

const regionNames = new Intl.DisplayNames(['en-IN'], { type: 'region' })

function countryLabel(code: string): string {
  if (code === 'unknown' || !/^[a-z]{2}$/i.test(code)) return 'Unknown'
  try {
    return regionNames.of(code.toUpperCase()) ?? code.toUpperCase()
  } catch {
    return code.toUpperCase()
  }
}

export default async function AnalyticsPage({ searchParams }: PageProps<'/admin/analytics'>) {
  await requireAdmin()
  const query = await searchParams
  const settings = await getSiteSettings()
  const today = todayIn(settings.analytics.timezone)
  const range = resolveRange(
    { range: one(query.range), from: one(query.from), to: one(query.to) },
    today,
  )
  const search = new URLSearchParams(
    range.preset ? { range: String(range.preset) } : { from: range.from, to: range.to },
  )
  const here = `/admin/analytics?${search}`

  const [
    totals,
    previous,
    trends,
    topPages,
    organic,
    sources,
    devices,
    countries,
    downloads,
    queries,
    zero,
    funnel,
    content,
    movers,
    vitals,
  ] = await Promise.all([
    getTotals(range.from, range.to),
    getTotals(range.previous.from, range.previous.to),
    Promise.all(TREND_METRICS.map((m) => getSeries(m.metric, range))),
    getTop('page.views', range, 10),
    getTop('organic.landings', range, 10),
    getTop('source.sessions', range, 8),
    getTop('device.sessions', range, 5),
    getTop('country.sessions', range, 8),
    getTop('resource.downloads', range, 10),
    getTop('search.queries', range, 10),
    getTop('search.zero', range, 10),
    getFunnel(range),
    getContentPerformance(range, 50),
    getMovers(7, 8),
    getWebVitals(range),
  ])
  const resourceTitles = await getResourceTitles(downloads.map((d) => d.dimension))
  const periodLabel = `previous ${range.days} days`

  return (
    <>
      <AdminHeader
        title="Analytics"
        description={`First-party, consent-aware analytics. Days are in ${settings.analytics.timezone}; totals refresh hourly.`}
        actions={
          <form action={refreshRollups}>
            <input type="hidden" name="from" value={range.from} />
            <input type="hidden" name="to" value={range.to} />
            <input type="hidden" name="back" value={here} />
            <button type="submit" className={buttonClasses('secondary', 'sm')}>
              Recalculate now
            </button>
          </form>
        }
      />
      {one(query.refreshed) ? <Notice>Recalculated from raw events.</Notice> : null}
      {one(query.refresh_error) ? (
        <Notice tone="danger">The numbers could not be recalculated. Try a shorter range.</Notice>
      ) : null}

      {/* One filter row scopes everything below it. */}
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <nav aria-label="Date range" className="flex flex-wrap gap-1">
          {RANGE_PRESETS.map((days) => (
            <Link
              key={days}
              href={`/admin/analytics?range=${days}`}
              aria-current={range.preset === days ? 'page' : undefined}
              className={cn(
                'inline-flex min-h-10 items-center rounded-control px-3 text-small',
                range.preset === days
                  ? 'bg-accent-soft font-medium text-accent-ink'
                  : 'text-text hover:bg-surface',
              )}
            >
              {days === 365 ? 'Last 12 months' : `Last ${days} days`}
            </Link>
          ))}
        </nav>
        <form method="get" className="flex flex-wrap items-end gap-2">
          <div>
            <label htmlFor="range-from" className="text-xs font-medium text-muted">
              From
            </label>
            <input
              id="range-from"
              type="date"
              name="from"
              defaultValue={range.from}
              max={today}
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="range-to" className="text-xs font-medium text-muted">
              To
            </label>
            <input
              id="range-to"
              type="date"
              name="to"
              defaultValue={range.to}
              max={today}
              className={inputClasses}
            />
          </div>
          <button type="submit" className={buttonClasses('secondary', 'sm')}>
            Apply
          </button>
        </form>
        <p className="w-full text-xs text-muted">
          {range.from} to {range.to} · compared with {range.previous.from} to {range.previous.to}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          label="Visitors"
          value={totals.visitors}
          previous={previous.visitors}
          periodLabel={periodLabel}
        />
        <StatTile
          label="Page views"
          value={totals.page_views}
          previous={previous.page_views}
          periodLabel={periodLabel}
        />
        <StatTile
          label="New visitors"
          value={totals.new_visitors}
          previous={previous.new_visitors}
          periodLabel={periodLabel}
        />
        <StatTile
          label="Returning visitors"
          value={totals.returning_visitors}
          previous={previous.returning_visitors}
          periodLabel={periodLabel}
        />
        <StatTile
          label="Sign-ins"
          value={totals.logins}
          previous={previous.logins}
          periodLabel={periodLabel}
        />
        <StatTile
          label="New accounts"
          value={totals.signups}
          previous={previous.signups}
          periodLabel={periodLabel}
        />
        <StatTile
          label="Downloads"
          value={totals.downloads}
          previous={previous.downloads}
          periodLabel={periodLabel}
        />
        <StatTile
          label="Searches"
          value={totals.searches}
          previous={previous.searches}
          periodLabel={periodLabel}
        />
      </div>
      <p className="mt-3 text-small text-muted">
        Active visitors on {range.to}:{' '}
        <strong className="font-semibold text-text">{formatValue(totals.dau ?? 0)}</strong> that day
        · <strong className="font-semibold text-text">{formatValue(totals.wau ?? 0)}</strong> in the
        last 7 days ·{' '}
        <strong className="font-semibold text-text">{formatValue(totals.mau ?? 0)}</strong> in the
        last 28 days
        {totals.login_failures > 0
          ? ` · ${formatValue(totals.login_failures)} failed sign-ins`
          : ''}
      </p>

      <h2 className="mt-8 mb-3 text-h3 font-semibold text-text">Trends</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        {TREND_METRICS.map((metric, index) => (
          <LineChart key={metric.metric} title={metric.label} data={trends[index]!} />
        ))}
      </div>

      <h2 className="mt-8 mb-3 text-h3 font-semibold text-text">Pages and traffic</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <BarList
          title="Most viewed pages"
          rows={topPages.map((row) => ({
            key: row.dimension,
            label: row.dimension,
            value: row.value,
            href: row.dimension,
          }))}
        />
        <BarList
          title="Landing pages from search engines"
          rows={organic.map((row) => ({
            key: row.dimension,
            label: row.dimension,
            value: row.value,
            href: row.dimension,
          }))}
          empty="No search-engine visits in this period yet."
        />
        <BarList
          title="Where visits come from"
          rows={sources.map((row) => ({
            key: row.dimension,
            label: sourceLabel(row.dimension),
            value: row.value,
          }))}
          showShare
        />
        <div className="grid gap-4">
          <BarList
            title="Devices"
            rows={devices.map((row) => ({
              key: row.dimension,
              label: row.dimension[0]!.toUpperCase() + row.dimension.slice(1),
              value: row.value,
            }))}
            showShare
          />
          <BarList
            title="Countries"
            rows={countries.map((row) => ({
              key: row.dimension,
              label: countryLabel(row.dimension),
              value: row.value,
            }))}
            showShare
          />
        </div>
      </div>

      <h2 className="mt-8 mb-3 text-h3 font-semibold text-text">Engagement</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <Funnel title="From visit to sign-in (sessions reaching each step)" steps={funnel} />
        <BarList
          title="Most downloaded"
          rows={downloads.map((row) => ({
            key: row.dimension,
            label: resourceTitles.get(row.dimension) ?? 'Removed resource',
            value: row.value,
          }))}
          empty="No downloads in this period yet."
        />
        <BarList
          title="Top searches"
          rows={queries.map((row) => ({
            key: row.dimension,
            label: row.dimension,
            value: row.value,
          }))}
          empty="No searches yet."
        />
        <BarList
          title="Searches with no results"
          rows={zero.map((row) => ({ key: row.dimension, label: row.dimension, value: row.value }))}
          empty="Every search found something."
          action={<span className="text-xs text-muted">Content ideas</span>}
        />
      </div>

      <Panel
        title="Content performance"
        className="mt-8"
        actions={
          <a
            href={`/api/admin/analytics/export?from=${range.from}&to=${range.to}`}
            className={buttonClasses('secondary', 'sm')}
            download
          >
            Export CSV
          </a>
        }
      >
        {content.length === 0 ? (
          <p className="text-small text-muted">No page views in this period yet.</p>
        ) : (
          <Table className="border-0">
            <thead>
              <tr>
                <th scope="col">Page</th>
                <th scope="col" className="text-right">
                  Views
                </th>
                <th scope="col" className="text-right">
                  Visitors
                </th>
                <th scope="col" className="text-right">
                  Avg. engaged
                </th>
                <th scope="col" className="text-right">
                  Read to end
                </th>
                <th scope="col" className="text-right">
                  Bounce
                </th>
                <th scope="col" className="text-right">
                  Helpful
                </th>
                <th scope="col" className="text-right">
                  Downloads
                </th>
              </tr>
            </thead>
            <tbody>
              {content.map((row) => (
                <tr key={row.path}>
                  <td className="min-w-56">
                    <a
                      href={row.path}
                      target="_blank"
                      rel="noopener"
                      className="text-text hover:text-accent-ink hover:underline"
                    >
                      {row.title?.split(' | ')[0] || row.path}
                    </a>
                    <p className="text-xs text-muted">{row.path}</p>
                  </td>
                  <td className="text-right tabular-nums">{formatValue(row.views)}</td>
                  <td className="text-right tabular-nums">{formatValue(row.visitors)}</td>
                  <td className="text-right tabular-nums">
                    {formatValue(row.avg_engaged_seconds, 'seconds')}
                  </td>
                  <td className="text-right tabular-nums">
                    {formatValue(row.scroll_completion, 'percent')}
                  </td>
                  <td className="text-right tabular-nums">
                    {formatValue(row.bounce_rate, 'percent')}
                  </td>
                  <td className="text-right whitespace-nowrap tabular-nums">
                    {row.helpful_yes + row.helpful_no > 0
                      ? `${row.helpful_yes} / ${row.helpful_yes + row.helpful_no}`
                      : '—'}
                  </td>
                  <td className="text-right tabular-nums">{formatValue(row.downloads)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>

      <div className="mt-8 grid gap-4 xl:grid-cols-2">
        <Panel title="Biggest movers (last 7 days vs the 7 before)">
          {movers.length === 0 ? (
            <p className="text-small text-muted">Not enough history yet.</p>
          ) : (
            <Table className="border-0">
              <thead>
                <tr>
                  <th scope="col">Page</th>
                  <th scope="col" className="text-right">
                    Views
                  </th>
                  <th scope="col" className="text-right">
                    Change
                  </th>
                </tr>
              </thead>
              <tbody>
                {movers.map((row) => (
                  <tr key={row.path}>
                    <td className="max-w-64 truncate">
                      <a
                        href={row.path}
                        target="_blank"
                        rel="noopener"
                        className="text-text hover:text-accent-ink hover:underline"
                      >
                        {row.path}
                      </a>
                    </td>
                    <td className="text-right text-muted tabular-nums">
                      {formatValue(row.previous)} →{' '}
                      <span className="text-text">{formatValue(row.current)}</span>
                    </td>
                    <td
                      className={cn(
                        'text-right whitespace-nowrap tabular-nums',
                        row.change >= 0 ? 'text-success' : 'text-danger',
                      )}
                    >
                      <span aria-hidden="true">{row.change >= 0 ? '▲' : '▼'}</span>{' '}
                      {row.change > 0 ? '+' : ''}
                      {formatValue(row.change)}
                      {row.changePct !== null
                        ? ` (${row.changePct > 0 ? '+' : ''}${Math.round(row.changePct * 100)}%)`
                        : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Panel>

        <Panel title="Core Web Vitals by page type (75th percentile)">
          {vitals.length === 0 ? (
            <p className="text-small text-muted">
              No measurements yet — they arrive as students browse.
            </p>
          ) : (
            <Table className="border-0">
              <thead>
                <tr>
                  <th scope="col">Page type</th>
                  {(['lcp', 'inp', 'cls', 'ttfb'] as const).map((name) => (
                    <th key={name} scope="col" className="text-right">
                      {VITAL_THRESHOLDS[name].label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vitals.map((row) => (
                  <tr key={row.page_type}>
                    <td>
                      <span className="text-text">{row.page_type.replace(/_/g, ' ')}</span>
                      <p className="text-xs text-muted">{formatValue(row.samples)} samples</p>
                    </td>
                    {(['lcp', 'inp', 'cls', 'ttfb'] as const).map((name) => (
                      <td key={name} className="text-right">
                        <Vital name={name} value={row[name]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Panel>
      </div>
    </>
  )
}

const RATING = {
  good: { icon: '✓', label: 'Good', className: 'text-success' },
  'needs-improvement': { icon: '!', label: 'Needs work', className: 'text-warning' },
  poor: { icon: '✕', label: 'Poor', className: 'text-danger' },
} as const

function Vital({ name, value }: { name: VitalName; value: number | null }) {
  const rating = vitalRating(name, value)
  if (value === null || !rating) return <span className="text-muted">—</span>
  const status = RATING[rating]
  const shown =
    name === 'cls'
      ? value.toFixed(2)
      : value >= 1000
        ? `${(value / 1000).toFixed(1)} s`
        : `${Math.round(value)} ms`
  return (
    <span className="inline-flex flex-col items-end">
      <span className="text-text tabular-nums">{shown}</span>
      <span className={cn('text-xs', status.className)}>
        <span aria-hidden="true">{status.icon}</span> {status.label}
      </span>
    </span>
  )
}
