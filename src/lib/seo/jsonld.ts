import type {
  BreadcrumbList,
  Course,
  FAQPage,
  LearningResource,
  Organization,
  Person,
  Question as SchemaQuestion,
  Quiz,
  WebSite,
  WithContext,
} from 'schema-dts'

import { env } from '@/env'
import type { AuthorRef, Faq, Question } from '@/lib/data/types'
import { mdxToPlainText, truncate } from '@/lib/mdx/plain'
import { absoluteUrl } from '@/lib/routes'
import type { SiteSettings } from '@/lib/settings/schema'
import { isoDuration } from '@/lib/utils/format'

/**
 * schema.org builders. Everything describes this site honestly: it is an
 * independent study resource about IIT Madras courses, not IIT Madras.
 */

const url = (path: string) => absoluteUrl(env.siteUrl, path)
const orgId = () => `${env.siteUrl}/#organization`
const siteId = () => `${env.siteUrl}/#website`

export function organizationJsonLd(settings: SiteSettings): WithContext<Organization> {
  const sameAs = Object.values(settings.social).filter((value): value is string => Boolean(value))
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': orgId(),
    name: settings.organization.name || settings.site_name,
    ...(settings.organization.legal_name ? { legalName: settings.organization.legal_name } : {}),
    url: env.siteUrl,
    logo: url('/icon.svg'),
    description: settings.description || undefined,
    ...(settings.contact.email ? { email: settings.contact.email } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  }
}

export function websiteJsonLd(settings: SiteSettings): WithContext<WebSite> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': siteId(),
    name: settings.site_name,
    url: env.siteUrl,
    inLanguage: 'en-IN',
    publisher: { '@id': orgId() },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${env.siteUrl}/search?q={search_term_string}` },
      // schema-dts does not model the "query-input" shorthand Google uses.
      ...({ 'query-input': 'required name=search_term_string' } as object),
    },
  }
}

export type Crumb = { name: string; path: string }

export function breadcrumbJsonLd(crumbs: Crumb[]): WithContext<BreadcrumbList> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: url(crumb.path),
    })),
  }
}

function person(author: AuthorRef | null): Person | undefined {
  if (!author) return undefined
  return {
    '@type': 'Person',
    name: author.name,
    ...(author.headline ? { jobTitle: author.headline } : {}),
    ...(author.sameAs.length > 0 ? { sameAs: author.sameAs } : {}),
  }
}

export function courseJsonLd(input: {
  name: string
  code: string | null
  description: string | null
  path: string
  officialUrl: string | null
  topics: string[]
}): WithContext<Course> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: `${input.name} — qualifier study guide`,
    ...(input.code ? { courseCode: input.code } : {}),
    description: truncate(input.description ?? input.name, 300),
    url: url(input.path),
    inLanguage: 'en',
    isAccessibleForFree: true,
    educationalLevel: 'Undergraduate (IIT Madras BS qualifier)',
    ...(input.topics.length > 0 ? { teaches: input.topics.slice(0, 20) } : {}),
    // We publish the study guide; the course itself is taught by IIT Madras.
    provider: { '@id': orgId() } as Organization,
    ...(input.officialUrl ? { sameAs: input.officialUrl } : {}),
  }
}

export function learningResourceJsonLd(input: {
  name: string
  description: string
  path: string
  resourceType: 'Lecture notes' | 'Assignment' | 'Practice problems' | 'Formula sheet' | 'Study guide'
  teaches: string[]
  minutes?: number | null
  author?: AuthorRef | null
  reviewer?: AuthorRef | null
  datePublished?: string | null
  dateModified?: string | null
  partOf?: { name: string; path: string } | null
}): WithContext<LearningResource> {
  const author = person(input.author ?? null)
  const reviewer = person(input.reviewer ?? null)
  return {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: input.name,
    description: truncate(input.description, 300),
    url: url(input.path),
    inLanguage: 'en-IN',
    isAccessibleForFree: true,
    learningResourceType: input.resourceType,
    educationalLevel: 'Undergraduate (IIT Madras BS qualifier)',
    ...(input.teaches.length > 0 ? { teaches: input.teaches.slice(0, 20) } : {}),
    ...(input.minutes ? { timeRequired: isoDuration(input.minutes) } : {}),
    ...(author ? { author } : { author: { '@id': orgId() } as Organization }),
    ...(reviewer ? { reviewedBy: reviewer } : {}),
    publisher: { '@id': orgId() } as Organization,
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
    ...(input.dateModified ? { dateModified: input.dateModified } : {}),
    ...(input.partOf ? { isPartOf: { '@type': 'Course', name: input.partOf.name, url: url(input.partOf.path) } } : {}),
  }
}

/** Only FAQs that are visible on the page may be marked up. */
export function faqJsonLd(faqs: Faq[]): WithContext<FAQPage> | null {
  if (faqs.length === 0) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: mdxToPlainText(faq.answerMdx) },
    })),
  }
}

/**
 * Practice quiz markup. Only emitted once answers are released, and only for
 * questions that have an answer to show.
 */
export function quizJsonLd(input: {
  name: string
  path: string
  topics: string[]
  questions: Question[]
}): WithContext<Quiz> | null {
  const answered = input.questions.filter((q) => q.answerMdx)
  if (answered.length === 0) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: input.name,
    url: url(input.path),
    educationalLevel: 'Undergraduate (IIT Madras BS qualifier)',
    ...(input.topics.length > 0 ? { about: input.topics.map((name) => ({ '@type': 'Thing', name })) } : {}),
    hasPart: answered.map(
      (q): SchemaQuestion => ({
        '@type': 'Question',
        eduQuestionType: q.type === 'mcq' ? 'Multiple choice' : q.type === 'msq' ? 'Checkbox' : 'Short answer',
        text: truncate(mdxToPlainText(q.questionMdx), 500),
        acceptedAnswer: {
          '@type': 'Answer',
          text: truncate(mdxToPlainText(q.explanationMdx ?? q.answerMdx), 1000),
        },
      }),
    ),
  }
}

const LINE_SEPARATOR = new RegExp(String.fromCharCode(0x2028), 'g')
const PARAGRAPH_SEPARATOR = new RegExp(String.fromCharCode(0x2029), 'g')

/** Serialises JSON-LD safely for inline <script> tags. */
export function serializeJsonLd(data: object): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(LINE_SEPARATOR, '\\u2028')
    .replace(PARAGRAPH_SEPARATOR, '\\u2029')
}
