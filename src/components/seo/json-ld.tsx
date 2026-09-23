import { serializeJsonLd } from '@/lib/seo/jsonld'

/** Server-rendered structured data. Pass one object or several. */
export function JsonLd({ data }: { data: object | Array<object | null> | null }) {
  const items = (Array.isArray(data) ? data : [data]).filter(
    (item): item is object => item !== null,
  )
  if (items.length === 0) return null
  return (
    <>
      {items.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          // Serialised with <, > and & escaped, so it cannot break out of the tag.
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(item) }}
        />
      ))}
    </>
  )
}
