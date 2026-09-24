import type { Metadata } from 'next'
import Link from 'next/link'

import { PageContext } from '@/components/analytics/page-context'
import { ResourceList } from '@/components/content/resource-list'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { getLectureCourses } from '@/lib/data/lectures'
import { getResourceGroups } from '@/lib/data/resources'
import { getSeoOverrides } from '@/lib/data/seo-overrides'
import { getSiteSettings } from '@/lib/data/settings'
import { LECTURES_PATH } from '@/lib/routes'
import { buildMetadata } from '@/lib/seo/metadata'

export async function generateMetadata(): Promise<Metadata> {
  const [settings, overrides] = await Promise.all([getSiteSettings(), getSeoOverrides()])
  return buildMetadata({
    settings,
    path: '/resources',
    fallbackTitle: `IITM BS Qualifier Resources – Official Links & Downloads | ${settings.site_name}`,
    fallbackDescription:
      'Official IIT Madras BS links and downloadable study resources for every qualifier course, in one place.',
    override: overrides['/resources'],
  })
}

export default async function ResourcesPage() {
  const [groups, lectureCourses] = await Promise.all([getResourceGroups(), getLectureCourses()])
  const lectureCount = lectureCourses.reduce((sum, course) => sum + course.videoCount, 0)
  return (
    <>
      <PageContext type="resources" />
      <PageHeader crumbs={[{ name: 'Resources', path: '/resources' }]} title="Resources" />
      <div className="container-page py-8 sm:py-10">
        <div className="container-reading space-y-10">
          {lectureCourses.length > 0 ? (
            <Link
              href={LECTURES_PATH}
              className="group block rounded-panel bg-accent-strong p-7 text-on-accent transition-shadow hover:shadow-card sm:p-9"
            >
              <h2 className="text-[1.625rem] leading-9 font-semibold">IIT Madras lectures</h2>
              <p className="mt-2 text-on-accent/80">
                {lectureCount.toLocaleString('en-IN')} official lecture videos for{' '}
                {lectureCourses.length} courses, week by week.
              </p>
              <span className="mt-6 inline-block text-small font-semibold underline decoration-on-accent/40 underline-offset-4 group-hover:decoration-on-accent">
                Browse lectures
              </span>
            </Link>
          ) : null}
          {groups.length === 0 && lectureCourses.length === 0 ? (
            <EmptyState title="Resources are on the way" description="Check back soon." />
          ) : (
            groups.map((group) => (
              <section key={group.label} aria-labelledby={`group-${group.label}`}>
                <h2 id={`group-${group.label}`} className="mb-3 text-h3 font-semibold">
                  {group.path ? (
                    <Link href={group.path} className="hover:text-accent-ink">
                      {group.label}
                    </Link>
                  ) : (
                    group.label
                  )}
                </h2>
                <ResourceList items={group.items} label={group.label} />
              </section>
            ))
          )}
        </div>
      </div>
    </>
  )
}
