import type { Metadata } from 'next'

import { CmsRoute, cmsMetadata } from '@/components/content/cms-route'
import { FaqAccordion } from '@/components/content/faq-accordion'
import { LinkList } from '@/components/content/link-list'
import { SectionHeading } from '@/components/ui/section-heading'
import { topPosts } from '@/lib/blog/helpers'
import { getBlogCategories, getBlogPostIndex } from '@/lib/data/blog'
import { getGlobalFaqs } from '@/lib/data/faqs'

/** The blog category whose posts are listed under the qualifier guide. */
const ADMISSIONS_CATEGORY = 'admissions'

export function generateMetadata(): Promise<Metadata> {
  return cmsMetadata('qualifier')
}

export default async function QualifierHubPage() {
  const [faqs, posts, categories] = await Promise.all([
    getGlobalFaqs(),
    getBlogPostIndex(),
    getBlogCategories(),
  ])
  const category = categories.find((c) => c.slug === ADMISSIONS_CATEGORY)
  const admissionPosts = category
    ? topPosts(
        posts.filter((post) => post.category.id === category.id),
        8,
      )
    : []
  return (
    <>
      <CmsRoute path="qualifier" listChildren />
      <div className="container-page pb-4">
        <div className="container-reading">
          {category && admissionPosts.length > 0 ? (
            <section aria-labelledby="admission-posts" className="mt-4">
              <SectionHeading
                id="admission-posts"
                title="More on admissions from the blog"
                action={{ href: category.path, label: `All ${category.name.toLowerCase()} posts` }}
              />
              <LinkList items={admissionPosts} label="Admission blog posts" />
            </section>
          ) : null}
          <FaqAccordion faqs={faqs} title="Qualifier FAQs" />
        </div>
      </div>
    </>
  )
}
